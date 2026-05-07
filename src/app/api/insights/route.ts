import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthUser } from "@/src/lib/api-auth";
import { getSubscription, getUsageLimits } from "@/src/lib/subscription";
import type { Transaction } from "@/src/types/transaction";

function monthBounds(year: number, month: number) {
  return {
    start: new Date(year, month, 1).toISOString().split("T")[0],
    end: new Date(year, month + 1, 0).toISOString().split("T")[0],
  };
}

function categoryTotals(
  txns: Transaction[],
  start: string,
  end: string
): Record<string, number> {
  return txns
    .filter((t) => t.type === "expense" && t.date >= start && t.date <= end)
    .reduce(
      (acc, t) => ({ ...acc, [t.category]: (acc[t.category] ?? 0) + Number(t.amount) }),
      {} as Record<string, number>
    );
}

function findRecurring(txns: Transaction[]) {
  const map: Record<string, { months: Set<string>; amount: number; label: string }> = {};

  txns
    .filter((t) => t.type === "expense" && (t.description ?? "").length > 2)
    .forEach((t) => {
      const key = (t.description ?? t.category).toLowerCase().trim();
      if (!map[key]) map[key] = { months: new Set(), amount: Number(t.amount), label: t.description ?? t.category };
      map[key].months.add(t.date.slice(0, 7));
    });

  return Object.values(map)
    .filter((v) => v.months.size >= 2)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
}

function buildSummary(txns: Transaction[]): string {
  const now = new Date();
  const [y, m] = [now.getFullYear(), now.getMonth()];
  const prevY = m === 0 ? y - 1 : y;
  const prevM = m === 0 ? 11 : m - 1;

  const { start: ts, end: te } = monthBounds(y, m);
  const { start: ls, end: le } = monthBounds(prevY, prevM);

  const thisCats = categoryTotals(txns, ts, te);
  const lastCats = categoryTotals(txns, ls, le);
  const thisTotal = Object.values(thisCats).reduce((a, b) => a + b, 0);
  const lastTotal = Object.values(lastCats).reduce((a, b) => a + b, 0);
  const thisIncome = txns
    .filter((t) => t.type === "income" && t.date >= ts && t.date <= te)
    .reduce((s, t) => s + Number(t.amount), 0);

  const savingsRate = thisIncome > 0 ? ((thisIncome - thisTotal) / thisIncome) * 100 : null;

  const fmtCats = (cats: Record<string, number>) =>
    Object.entries(cats).length
      ? Object.entries(cats)
          .sort((a, b) => b[1] - a[1])
          .map(([c, a]) => `  ${c}: $${a.toFixed(2)}`)
          .join("\n")
      : "  (none)";

  const changes = [...new Set([...Object.keys(thisCats), ...Object.keys(lastCats)])]
    .map((cat) => {
      const cur = thisCats[cat] ?? 0;
      const prev = lastCats[cat] ?? 0;
      if (cur === 0 && prev === 0) return null;
      if (prev === 0) return `  ${cat}: NEW $${cur.toFixed(2)}`;
      const pct = ((cur - prev) / prev) * 100;
      return `  ${cat}: ${cur >= prev ? "+" : ""}$${(cur - prev).toFixed(2)} (${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%)`;
    })
    .filter(Boolean)
    .join("\n");

  const recurring = findRecurring(txns)
    .map((r) => `  ${r.label}: ~$${r.amount.toFixed(2)}/mo (${r.months.size} months)`)
    .join("\n") || "  None detected";

  const top10 = txns
    .filter((t) => t.type === "expense" && t.date >= ts && t.date <= te)
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 10)
    .map((t, i) => `  ${i + 1}. ${t.description || t.category}: $${Number(t.amount).toFixed(2)} (${t.category})`)
    .join("\n") || "  (none)";

  const monthlyTotals = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(y, m - (5 - i), 1);
    const { start: ms, end: me } = monthBounds(d.getFullYear(), d.getMonth());
    const amt = txns
      .filter((t) => t.type === "expense" && t.date >= ms && t.date <= me)
      .reduce((s, t) => s + Number(t.amount), 0);
    return `  ${d.toLocaleString("en-US", { month: "short", year: "numeric" })}: $${amt.toFixed(2)}`;
  }).join("\n");

  const thisLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const prevLabel = new Date(prevY, prevM, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  return `=== FINANCIAL SUMMARY ===

THIS MONTH (${thisLabel}):
Expenses by category:
${fmtCats(thisCats)}
Total expenses: $${thisTotal.toFixed(2)}
Total income: $${thisIncome.toFixed(2)}${savingsRate !== null ? `\nSavings rate: ${savingsRate.toFixed(1)}%` : ""}
Transactions this month: ${txns.filter((t) => t.date >= ts && t.date <= te).length}

LAST MONTH (${prevLabel}):
Expenses by category:
${fmtCats(lastCats)}
Total expenses: $${lastTotal.toFixed(2)}

CATEGORY CHANGES (this vs last month):
${changes || "  No comparison data yet"}

RECURRING CHARGES DETECTED:
${recurring}

TOP 10 EXPENSES THIS MONTH:
${top10}

MONTHLY EXPENSE TOTALS (last 6 months):
${monthlyTotals}

TOTAL TRANSACTIONS IN HISTORY: ${txns.length}`;
}

export async function GET(request: Request) {
  const { user, supabase, error: authError } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: authError ?? "Unauthorized" }, { status: 401 });

  const sub = await getSubscription(user.id, supabase);
  if (!getUsageLimits(sub).canUseInsights) {
    return NextResponse.json(
      { error: "AI insights is a Pro feature. Upgrade to unlock.", code: "PRO_REQUIRED" },
      { status: 403 }
    );
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id);

  const txns = (transactions ?? []) as Transaction[];

  if (txns.length < 10) {
    return NextResponse.json(
      { error: "Not enough transactions for analysis (need at least 10)" },
      { status: 400 }
    );
  }

  const summary = buildSummary(txns);

  const client = new Anthropic();
  let rawText: string;

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are a personal finance analyst. Analyze the transaction data and provide 4-6 actionable insights.

Focus on:
1. SUBSCRIPTIONS: Flag recurring charges, especially ones that seem redundant (multiple streaming services, forgotten subscriptions). Show monthly cost.
2. SPENDING ANOMALIES: Flag categories with >30% increase this month vs last month.
3. PATTERNS: Identify spending patterns with specific numbers.
4. SAVINGS OPPORTUNITIES: Concrete, data-driven suggestions.
5. POSITIVE TRENDS: Mention improvements — people need encouragement.

Return ONLY valid JSON, no markdown, no prose:
{"insights":[{"type":"subscription"|"anomaly"|"pattern"|"saving"|"positive","title":"under 60 chars","description":"2-3 sentences with specific numbers","amount":number_or_null,"priority":"high"|"medium"|"low"}]}

Skip any insight where you lack concrete data. Be specific — use the actual numbers from the data below.

${summary}`,
        },
      ],
    });

    const content = msg.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");
    rawText = content.text;
  } catch (err) {
    return NextResponse.json(
      { error: `AI analysis failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 500 }
    );
  }

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as { insights: unknown[] };
    return NextResponse.json({ insights: parsed.insights });
  } catch {
    return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
  }
}
