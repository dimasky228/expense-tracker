import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/src/lib/supabase/server";
import { getSubscription, isPro as checkIsPro, getUsageLimits } from "@/src/lib/subscription";
import { getImportCount, getReceiptScanCount, currentMonth } from "@/src/lib/usage";
import type { Transaction } from "@/src/types/transaction";
import AddTransactionModal from "@/src/components/AddTransactionModal";
import CsvImportModal from "@/src/components/CsvImportModal";
import ReceiptImportModal from "@/src/components/ReceiptImportModal";
import TransactionList from "@/src/components/TransactionList";
import SpendingByCategory from "@/src/components/SpendingByCategory";
import MonthlyTrend from "@/src/components/MonthlyTrend";
import TopSpending from "@/src/components/TopSpending";
import InsightsPanel from "@/src/components/InsightsPanel";
import ExportPdfButton from "@/src/components/ExportPdfButton";
import UpgradeButton from "@/src/components/UpgradeButton";
import UpgradeSuccessToast from "@/src/components/UpgradeSuccessToast";
import AccountFilter from "@/src/components/AccountFilter";
import MonthNavigation from "@/src/components/MonthNavigation";
import BudgetOverview from "@/src/components/BudgetOverview";
import BudgetAlerts from "@/src/components/BudgetAlerts";
import { getBudgetStatus } from "@/src/lib/budgets";
import RecurringWidget from "@/src/components/RecurringWidget";
import type { RecurringItem } from "@/src/types/recurring";
import GoalsWidget from "@/src/components/GoalsWidget";
import type { Goal } from "@/src/types/goals";

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

function parseMonthSlug(slug: string): { year: number; month: number } | null {
  const match = slug.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // 0-indexed
  if (month < 0 || month > 11) return null;
  return { year, month };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; account?: string; month?: string }>;
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
  const [sub, importsUsed, receiptScansUsed] = await Promise.all([
    getSubscription(user.id),
    getImportCount(user.id, month),
    getReceiptScanCount(user.id, month),
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

  // Resolve selected month
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const nowSlug = `${nowYear}-${String(nowMonth + 1).padStart(2, "0")}`;

  const parsed = params.month ? parseMonthSlug(params.month) : null;
  const selectedYear = parsed?.year ?? nowYear;
  const selectedMonth = parsed?.month ?? nowMonth;
  const selectedSlug = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
  const isCurrentMonth = selectedSlug === nowSlug;

  // Apply account filter
  const filteredTransactions = accountFilter
    ? allTransactions.filter((t) => t.account === accountFilter)
    : allTransactions;

  const { start, end } = getMonthBounds(selectedYear, selectedMonth);

  // Fetch budget status, recurring items, and goals in parallel
  const [budgetStatuses, recurringData, goalsData] = await Promise.all([
    getBudgetStatus(user.id, start, end),
    supabase.from("recurring").select("*").eq("user_id", user.id).eq("is_active", true).order("next_date"),
    supabase.from("goals").select("*").eq("user_id", user.id).order("is_completed").order("created_at"),
  ]);
  const recurringItems = (recurringData.data ?? []) as RecurringItem[];
  const goals = (goalsData.data ?? []) as Goal[];
  const budgetMonth = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;

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

  // Monthly trend: 6 months ending at selected month
  const selectedDate = new Date(selectedYear, selectedMonth, 1);
  const selectedMonthShort = selectedDate.toLocaleString(intlLocale, { month: "short" });
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(selectedYear, selectedMonth - (5 - i), 1);
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

  const monthLabel = selectedDate.toLocaleString(intlLocale, { month: "long", year: "numeric" });

  return (
    <div>
      <UpgradeSuccessToast show={showUpgradeToast} />

      {!isPro && <UpgradeButton variant="banner" />}

      <BudgetAlerts statuses={budgetStatuses} month={budgetMonth} />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <MonthNavigation
            label={monthLabel}
            currentSlug={selectedSlug}
            isCurrentMonth={isCurrentMonth}
          />
          <p className="mt-1 text-sm text-zinc-400">{t("monthlyOverview")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
          <ExportPdfButton month={selectedSlug} isPro={isPro} />
          <CsvImportModal isPro={isPro} importsUsed={importsUsed} />
          <ReceiptImportModal isPro={isPro} scansUsed={receiptScansUsed} />
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

      <BudgetOverview statuses={budgetStatuses} />
      <RecurringWidget items={recurringItems} />
      <GoalsWidget goals={goals} />

      <div id="ai-insights">
        <InsightsPanel
          totalTransactions={filteredTransactions.length}
          isPro={isPro}
        />
      </div>

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
            <MonthlyTrend data={monthlyData} currentMonth={selectedMonthShort} />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="mb-4 text-sm font-semibold text-zinc-300">{t("topSpending")}</p>
          <TopSpending data={categoryData.slice(0, 5)} />
        </div>
      </div>

      <TransactionList transactions={monthTransactions} />

      {limits && null}
    </div>
  );
}
