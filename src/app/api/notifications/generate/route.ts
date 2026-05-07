import { getAuthUser } from "@/src/lib/api-auth";
import { getBudgetStatus } from "@/src/lib/budgets";
import type { NotificationType } from "@/src/lib/notifications";

type NewNotification = {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
};

function monthBounds(year: number, month: number) {
  const start = new Date(year, month, 1).toISOString().split("T")[0]!;
  const end = new Date(year, month + 1, 0).toISOString().split("T")[0]!;
  return { start, end };
}

export async function POST(request: Request) {
  const { user, supabase, error: authError } = await getAuthUser(request);
  if (!user) return Response.json({ error: authError ?? "Unauthorized" }, { status: 401 });

  const userId = user.id;

  let enabled: NotificationType[] = [];
  try {
    const body = (await request.json()) as { enabled?: NotificationType[] };
    enabled = body.enabled ?? [];
  } catch {
    // use all types
  }

  const now = new Date();
  const { start: curStart, end: curEnd } = monthBounds(now.getFullYear(), now.getMonth());
  const { start: prevStart, end: prevEnd } = monthBounds(now.getFullYear(), now.getMonth() - 1);
  const currentYM = curStart.substring(0, 7);
  const today = now.toISOString().split("T")[0]!;
  const in3Days = new Date(now.getTime() + 3 * 86400000).toISOString().split("T")[0]!;

  // Fetch all data in parallel
  const [
    budgetStatuses,
    { data: recurring },
    { data: goals },
    { data: curTxns },
    { data: prevTxns },
    { data: existingNotifs },
  ] = await Promise.all([
    getBudgetStatus(userId, curStart, curEnd, supabase).catch(() => []),
    supabase.from("recurring").select("id, name, amount, next_date").eq("user_id", userId).eq("is_active", true),
    supabase.from("goals").select("id, name, target_amount, current_amount, deadline, is_completed").eq("user_id", userId).eq("is_completed", false),
    supabase.from("transactions").select("category, amount, type").eq("user_id", userId).gte("date", curStart).lte("date", curEnd),
    supabase.from("transactions").select("category, amount, type").eq("user_id", userId).gte("date", prevStart).lte("date", prevEnd),
    supabase
      .from("notifications")
      .select("metadata")
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
  ]);

  // Build dedup set from existing notifications
  const existingKeys = new Set<string>();
  for (const n of existingNotifs ?? []) {
    const key = (n.metadata as Record<string, unknown>)?.dedup_key as string | undefined;
    if (key) existingKeys.add(key);
  }

  const toInsert: NewNotification[] = [];

  function tryAdd(
    type: NotificationType,
    title: string,
    message: string,
    dedupKey: string,
    meta: Record<string, unknown> = {}
  ) {
    if (enabled.length > 0 && !enabled.includes(type)) return;
    if (existingKeys.has(dedupKey)) return;
    toInsert.push({ user_id: userId, type, title, message, metadata: { dedup_key: dedupKey, ...meta } });
    existingKeys.add(dedupKey); // prevent duplicates within same run
  }

  // 1. Budget checks
  for (const s of budgetStatuses) {
    const spent = s.spent.toFixed(2);
    const budget = s.budget.toFixed(0);
    const pct = s.percentage.toFixed(0);
    if (s.percentage >= 100) {
      tryAdd(
        "budget_exceeded",
        `${s.category} budget exceeded`,
        `${s.category} is at ${pct}% of your $${budget} budget ($${spent} spent)`,
        `budget_exceeded:${s.category}:${currentYM}`,
        { category: s.category, percentage: s.percentage }
      );
    } else if (s.percentage >= 80) {
      tryAdd(
        "budget_warning",
        `${s.category} at ${pct}% of budget`,
        `${s.category} is at ${pct}% of your $${budget} budget ($${spent} spent)`,
        `budget_warning:${s.category}:${currentYM}`,
        { category: s.category, percentage: s.percentage }
      );
    }
  }

  // 2. Recurring checks
  for (const item of recurring ?? []) {
    if (!item.next_date) continue;
    const amt = `$${Number(item.amount).toFixed(2)}`;
    if (item.next_date < today) {
      tryAdd(
        "recurring_overdue",
        `${item.name} payment overdue`,
        `${item.name} (${amt}) was due on ${item.next_date} and hasn't been recorded yet`,
        `recurring_overdue:${item.id}:${item.next_date}`,
        { recurring_id: item.id }
      );
    } else if (item.next_date <= in3Days) {
      const ms = new Date(item.next_date + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime();
      const days = Math.round(ms / 86400000);
      const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
      tryAdd(
        "recurring_due",
        `${item.name} due ${when}`,
        `${item.name} (${amt}) is scheduled for ${item.next_date}`,
        `recurring_due:${item.id}:${item.next_date}`,
        { recurring_id: item.id }
      );
    }
  }

  // 3. Goal checks
  const MILESTONES = [25, 50, 75, 100];
  for (const goal of goals ?? []) {
    const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
    const cur = `$${Number(goal.current_amount).toFixed(0)}`;
    const tgt = `$${Number(goal.target_amount).toFixed(0)}`;

    for (const m of MILESTONES) {
      if (pct >= m) {
        tryAdd(
          "goal_milestone",
          `${goal.name} reached ${m}%!`,
          `Great progress on "${goal.name}" — ${m}% funded (${cur} of ${tgt})`,
          `goal_milestone:${goal.id}:${m}`,
          { goal_id: goal.id, milestone: m }
        );
      }
    }

    if (goal.deadline) {
      const daysLeft = Math.ceil(
        (new Date(goal.deadline + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000
      );
      if (daysLeft >= 0 && daysLeft <= 30) {
        tryAdd(
          "goal_deadline",
          `${goal.name} deadline in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
          `"${goal.name}" is due on ${goal.deadline}. You're at ${pct.toFixed(0)}% (${cur} of ${tgt})`,
          `goal_deadline:${goal.id}:${currentYM}`,
          { goal_id: goal.id, days_left: daysLeft }
        );
      }
    }
  }

  // 4. Spending spike check
  const curSpend: Record<string, number> = {};
  const prevSpend: Record<string, number> = {};
  for (const t of curTxns ?? []) {
    if (t.type === "expense") curSpend[t.category] = (curSpend[t.category] ?? 0) + Number(t.amount);
  }
  for (const t of prevTxns ?? []) {
    if (t.type === "expense") prevSpend[t.category] = (prevSpend[t.category] ?? 0) + Number(t.amount);
  }

  for (const [cat, curAmt] of Object.entries(curSpend)) {
    const prevAmt = prevSpend[cat] ?? 0;
    if (prevAmt >= 20 && curAmt >= prevAmt * 1.5) {
      const upPct = (((curAmt / prevAmt) - 1) * 100).toFixed(0);
      tryAdd(
        "spending_spike",
        `${cat} spending up ${upPct}%`,
        `${cat}: $${curAmt.toFixed(2)} this month vs $${prevAmt.toFixed(2)} last month (+${upPct}%)`,
        `spending_spike:${cat}:${currentYM}`,
        { category: cat, current: curAmt, previous: prevAmt }
      );
    }
  }

  // 5. Savings rate check
  const totalIncome = (curTxns ?? [])
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = Object.values(curSpend).reduce((s, a) => s + a, 0);

  if (totalIncome > 0) {
    const savingsRate = (totalIncome - totalExpenses) / totalIncome;
    if (savingsRate >= 0.3) {
      tryAdd(
        "savings_positive",
        `Saving ${(savingsRate * 100).toFixed(0)}% of income this month!`,
        `You've saved $${(totalIncome - totalExpenses).toFixed(2)} — ${(savingsRate * 100).toFixed(0)}% of your $${totalIncome.toFixed(2)} income. Keep it up!`,
        `savings_positive:${currentYM}`,
        { savings_rate: savingsRate }
      );
    }
  }

  // Cleanup notifications older than 30 days
  await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)
    .lt("created_at", new Date(Date.now() - 30 * 86400000).toISOString());

  // Batch insert
  if (toInsert.length > 0) {
    await supabase.from("notifications").insert(toInsert);
  }

  return Response.json({ generated: toInsert.length });
}
