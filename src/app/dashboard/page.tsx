import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import type { Transaction } from "@/src/types/transaction";
import AddTransactionModal from "@/src/components/AddTransactionModal";
import CsvImportModal from "@/src/components/CsvImportModal";
import TransactionList from "@/src/components/TransactionList";
import SpendingByCategory from "@/src/components/SpendingByCategory";
import MonthlyTrend from "@/src/components/MonthlyTrend";
import TopSpending from "@/src/components/TopSpending";
import InsightsPanel from "@/src/components/InsightsPanel";
import ExportPdfButton from "@/src/components/ExportPdfButton";

function getMonthBounds(year: number, month: number) {
  const start = new Date(year, month, 1).toISOString().split("T")[0];
  const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
  return { start, end };
}

function formatCurrency(amount: number, sign = true) {
  const abs = Math.abs(amount).toFixed(2);
  if (!sign) return `$${abs}`;
  return amount < 0 ? `-$${abs}` : `+$${abs}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const allTransactions = (transactions ?? []) as Transaction[];

  const now = new Date();
  const { start, end } = getMonthBounds(now.getFullYear(), now.getMonth());

  const monthTransactions = allTransactions.filter(
    (t) => t.date >= start && t.date <= end
  );
  const monthExpenses = monthTransactions.filter((t) => t.type === "expense");

  const totalSpent = monthExpenses.reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const net = totalIncome - totalSpent;

  // Category breakdown for donut + top-5 list
  const catMap = monthExpenses.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + Number(t.amount);
      return acc;
    },
    {} as Record<string, number>
  );
  const categoryData = Object.entries(catMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Last 6 months for bar chart
  const currentMonthShort = now.toLocaleString("en-US", { month: "short" });
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const { start: ms, end: me } = getMonthBounds(d.getFullYear(), d.getMonth());
    const amount = allTransactions
      .filter((t) => t.type === "expense" && t.date >= ms && t.date <= me)
      .reduce((s, t) => s + Number(t.amount), 0);
    return { month: d.toLocaleString("en-US", { month: "short" }), amount };
  });

  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">{monthLabel}</h1>
          <p className="mt-1 text-sm text-zinc-400">Monthly overview</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportPdfButton month={currentMonth} />
          <CsvImportModal />
          <AddTransactionModal />
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-400">Total spent</p>
          <p className="mt-1 text-2xl font-bold text-red-400">
            {formatCurrency(-totalSpent)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-400">Total income</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-400">Net</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              net >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatCurrency(net)}
          </p>
        </div>
      </div>

      {/* AI Insights — loads async after page paint */}
      <InsightsPanel totalTransactions={allTransactions.length} />

      {/* Analytics */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Analytics
        </h2>

        {/* Charts row */}
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="mb-4 text-sm font-semibold text-zinc-300">
              Spending by Category
            </p>
            <SpendingByCategory data={categoryData} />
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="mb-4 text-sm font-semibold text-zinc-300">
              Monthly Trend
            </p>
            <MonthlyTrend data={monthlyData} currentMonth={currentMonthShort} />
          </div>
        </div>

        {/* Top spending */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="mb-4 text-sm font-semibold text-zinc-300">
            Top Spending
          </p>
          <TopSpending data={categoryData.slice(0, 5)} />
        </div>
      </div>

      {/* Transaction list */}
      <TransactionList transactions={allTransactions} />
    </div>
  );
}
