import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import GoalsManager from "@/src/components/GoalsManager";
import type { Goal } from "@/src/types/goals";

async function getAvgMonthlySavings(userId: string): Promise<number> {
  const supabase = await createClient();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data } = await supabase
    .from("transactions")
    .select("amount, type, date")
    .eq("user_id", userId)
    .gte("date", sixMonthsAgo.toISOString().split("T")[0]);

  if (!data || data.length === 0) return 0;

  const monthMap = new Map<string, { income: number; expense: number }>();
  for (const t of data) {
    const key = (t.date as string).substring(0, 7);
    if (!monthMap.has(key)) monthMap.set(key, { income: 0, expense: 0 });
    const m = monthMap.get(key)!;
    if (t.type === "income") m.income += Number(t.amount);
    else m.expense += Number(t.amount);
  }

  const monthly = Array.from(monthMap.values())
    .map((m) => m.income - m.expense)
    .filter((s) => s > 0);

  if (monthly.length === 0) return 0;
  return monthly.reduce((a, b) => a + b, 0) / monthly.length;
}

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data }, avgMonthlySavings] = await Promise.all([
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("is_completed")
      .order("created_at"),
    getAvgMonthlySavings(user.id),
  ]);

  const goals = (data ?? []) as Goal[];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-50">Financial Goals</h1>
        <p className="mt-1 text-sm text-zinc-400">Set targets, track progress, celebrate wins</p>
      </div>

      <GoalsManager initialGoals={goals} avgMonthlySavings={Math.round(avgMonthlySavings)} />
    </div>
  );
}
