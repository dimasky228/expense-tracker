import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getBudgets, getBudgetStatus, getUnbudgetedCategories } from "@/src/lib/budgets";
import BudgetManager from "@/src/components/BudgetManager";

function getCurrentMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  return { start, end };
}

export default async function BudgetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { start, end } = getCurrentMonthBounds();

  const budgets = await getBudgets(user.id);
  const [statuses, unbudgeted] = await Promise.all([
    getBudgetStatus(user.id, start, end),
    getUnbudgetedCategories(user.id, start, end, budgets),
  ]);

  const now = new Date();
  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-zinc-50">Monthly Budgets</h1>
          <p className="mt-1 text-sm text-zinc-400">{monthLabel}</p>
        </div>
      </div>

      <BudgetManager
        initialStatuses={statuses}
        unbudgeted={unbudgeted}
      />
    </div>
  );
}
