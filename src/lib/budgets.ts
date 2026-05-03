import { createClient } from "@/src/lib/supabase/server";

export type Budget = {
  id: string;
  category: string;
  amount: number;
};

export type BudgetStatus = {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
  status: "ok" | "warning" | "danger" | "over";
};

export async function getBudgets(userId: string): Promise<Budget[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("budgets")
    .select("id, category, amount")
    .eq("user_id", userId)
    .order("category");

  return (data ?? []) as Budget[];
}

export async function getBudgetStatus(
  userId: string,
  monthStart: string,
  monthEnd: string
): Promise<BudgetStatus[]> {
  const supabase = await createClient();

  const [{ data: budgets }, { data: transactions }] = await Promise.all([
    supabase
      .from("budgets")
      .select("category, amount")
      .eq("user_id", userId),
    supabase
      .from("transactions")
      .select("category, amount, type")
      .eq("user_id", userId)
      .eq("type", "expense")
      .neq("category", "Transfer")
      .gte("date", monthStart)
      .lte("date", monthEnd),
  ]);

  const spentMap: Record<string, number> = {};
  for (const tr of transactions ?? []) {
    spentMap[tr.category] = (spentMap[tr.category] ?? 0) + Number(tr.amount);
  }

  return (budgets ?? []).map((b) => {
    const spent = spentMap[b.category] ?? 0;
    const percentage = b.amount > 0 ? (spent / Number(b.amount)) * 100 : 0;
    const status =
      percentage > 100 ? "over" :
      percentage >= 90 ? "danger" :
      percentage >= 70 ? "warning" : "ok";

    return {
      category: b.category,
      budget: Number(b.amount),
      spent,
      percentage,
      status,
    };
  });
}

// Returns categories that have spending this month but no budget
export async function getUnbudgetedCategories(
  userId: string,
  monthStart: string,
  monthEnd: string,
  budgets: Budget[]
): Promise<{ category: string; spent: number }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("category, amount")
    .eq("user_id", userId)
    .eq("type", "expense")
    .neq("category", "Transfer")
    .gte("date", monthStart)
    .lte("date", monthEnd);

  const budgetedCategories = new Set(budgets.map((b) => b.category));
  const spentMap: Record<string, number> = {};
  for (const tr of data ?? []) {
    if (!budgetedCategories.has(tr.category)) {
      spentMap[tr.category] = (spentMap[tr.category] ?? 0) + Number(tr.amount);
    }
  }

  return Object.entries(spentMap)
    .map(([category, spent]) => ({ category, spent }))
    .sort((a, b) => b.spent - a.spent);
}
