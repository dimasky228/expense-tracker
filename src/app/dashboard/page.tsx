import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import type { Transaction } from "@/src/types/transaction";
import AddTransactionModal from "@/src/components/AddTransactionModal";
import TransactionList from "@/src/components/TransactionList";

function getMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
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

  const { start, end } = getMonthBounds();
  const monthTransactions = allTransactions.filter(
    (t) => t.date >= start && t.date <= end
  );

  const totalSpent = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const net = totalIncome - totalSpent;

  const monthLabel = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Header row */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">{monthLabel}</h1>
          <p className="mt-1 text-sm text-zinc-400">Monthly overview</p>
        </div>
        <AddTransactionModal />
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

      {/* Transaction list */}
      <TransactionList transactions={allTransactions} />
    </div>
  );
}
