import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/src/lib/supabase/server";
import { getSubscription, isPro as checkIsPro, getUsageLimits } from "@/src/lib/subscription";
import { getImportCount, currentMonth } from "@/src/lib/usage";
import type { Transaction } from "@/src/types/transaction";
import AddTransactionModal from "@/src/components/AddTransactionModal";
import CsvImportModal from "@/src/components/CsvImportModal";
import TransactionList from "@/src/components/TransactionList";
import SpendingByCategory from "@/src/components/SpendingByCategory";
import MonthlyTrend from "@/src/components/MonthlyTrend";
import TopSpending from "@/src/components/TopSpending";
import InsightsPanel from "@/src/components/InsightsPanel";
import ExportPdfButton from "@/src/components/ExportPdfButton";
import UpgradeButton from "@/src/components/UpgradeButton";
import UpgradeSuccessToast from "@/src/components/UpgradeSuccessToast";
import AccountFilter from "@/src/components/AccountFilter";

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; account?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [t, locale] = await Promise.all([
    getTranslations("dashboard"),
    getLocale(),
  ]);

  const month = currentMonth();
  const [sub, importsUsed] = await Promise.all([
    getSubscription(user.id),
    getImportCount(user.id, month),
  ]);

  const isPro = checkIsPro(sub);
  const limits = getUsageLimits(sub);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const allTransactions = (transactions ?? []) as Transaction[];

  // Distinct accounts for filter tabs (only accounts that have been named)
  const distinctAccounts = [
    ...new Set(
      allTransactions.map((t) => t.account).filter((a): a is string => !!a)
    ),
  ].sort();

  const params = await searchParams;
  const accountFilter = params.account ?? null;
  const showUpgradeToast = params.upgraded === "true";

  // Apply account filter
  const filteredTransactions = accountFilter
    ? allTransactions.filter((t) => t.account === accountFilter)
    : allTransactions;

  const now = new Date();
  const { start, end } = getMonthBounds(now.getFullYear(), now.getMonth());

  const monthTransactions = filteredTransactions.filter(
    (tr) => tr.date >= start && tr.date <= end
  );

  // Exclude Transfer category from spending calculations
  const monthExpenses = monthTransactions.filter(
    (tr) => tr.type === "expense" && tr.category !== "Transfer"
  );
  const totalSpent = monthExpenses.reduce((s, tr) => s + Number(tr.amount), 0);
  const totalIncome = monthTransactions
    .filter((tr) => tr.type === "income")
    .reduce((s, tr) => s + Number(tr.amount), 0);
  const net = totalIncome - totalSpent;

  const catMap = monthExpenses.reduce(
    (acc, tr) => {
      acc[tr.category] = (acc[tr.category] ?? 0) + Number(tr.amount);
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

  const intlLocale = locale === "ru" ? "ru-RU" : "en-US";
  const currentMonthShort = now.toLocaleString(intlLocale, { month: "short" });
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const { start: ms, end: me } = getMonthBounds(d.getFullYear(), d.getMonth());
    const amount = filteredTransactions
      .filter(
        (tr) =>
          tr.type === "expense" &&
          tr.category !== "Transfer" &&
          tr.date >= ms &&
          tr.date <= me
      )
      .reduce((s, tr) => s + Number(tr.amount), 0);
    return { month: d.toLocaleString(intlLocale, { month: "short" }), amount };
  });

  const monthLabel = now.toLocaleString(intlLocale, { month: "long", year: "numeric" });
  const currentMonthSlug = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div>
      <UpgradeSuccessToast show={showUpgradeToast} />

      {!isPro && <UpgradeButton variant="banner" />}

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">{monthLabel}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t("monthlyOverview")}</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportPdfButton month={currentMonthSlug} isPro={isPro} />
          <CsvImportModal isPro={isPro} importsUsed={importsUsed} />
          <AddTransactionModal />
        </div>
      </div>

      {/* Account filter */}
      {distinctAccounts.length > 0 && (
        <div className="mb-6">
          <AccountFilter
            accounts={distinctAccounts}
            currentAccount={accountFilter}
          />
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-400">{t("totalSpent")}</p>
          <p className="mt-1 text-2xl font-bold text-red-400">
            {formatCurrency(-totalSpent)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-400">{t("totalIncome")}</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-400">{t("net")}</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              net >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatCurrency(net)}
          </p>
        </div>
      </div>

      <InsightsPanel
        totalTransactions={filteredTransactions.length}
        isPro={isPro}
      />

      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          {t("analytics")}
        </h2>

        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="mb-4 text-sm font-semibold text-zinc-300">{t("spendingByCategory")}</p>
            <SpendingByCategory data={categoryData} />
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="mb-4 text-sm font-semibold text-zinc-300">{t("monthlyTrend")}</p>
            <MonthlyTrend data={monthlyData} currentMonth={currentMonthShort} />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="mb-4 text-sm font-semibold text-zinc-300">{t("topSpending")}</p>
          <TopSpending data={categoryData.slice(0, 5)} />
        </div>
      </div>

      <TransactionList transactions={filteredTransactions} />

      {limits && null}
    </div>
  );
}
