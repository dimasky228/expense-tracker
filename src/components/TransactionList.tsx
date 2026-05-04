"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/src/lib/supabase/client";
import { getCurrency, formatAmount as formatWithCurrency } from "@/src/lib/currency";
import type { Transaction } from "@/src/types/transaction";

const CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Transport",
  "Housing",
  "Entertainment",
  "Shopping",
  "Health",
  "Utilities",
  "Subscriptions",
  "Education",
  "Travel",
  "Transfer",
  "Salary",
  "Freelance",
  "Investment",
  "Other",
];

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type EditState = {
  description: string;
  category: string;
  amount: string;
  date: string;
  type: "expense" | "income";
};

function TransactionRow({
  transaction,
  currency,
  onDeleted,
  onEdited,
}: {
  transaction: Transaction;
  currency: string;
  onDeleted: () => void;
  onEdited: () => void;
}) {
  const t = useTranslations("transaction");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<EditState>({
    description: transaction.description ?? "",
    category: transaction.category,
    amount: String(Number(transaction.amount).toFixed(2)),
    date: transaction.date,
    type: transaction.type,
  });

  const formattedAmount = formatWithCurrency(Number(transaction.amount), currency);
  const displayAmount = transaction.type === "expense"
    ? `-${formattedAmount}`
    : `+${formattedAmount}`;

  async function handleDelete() {
    if (!window.confirm(t("deleteConfirm"))) return;
    const supabase = createClient();
    await supabase.from("transactions").delete().eq("id", transaction.id);
    onDeleted();
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("transactions")
      .update({
        description: edit.description || null,
        category: edit.category,
        amount: parseFloat(edit.amount) || 0,
        date: edit.date,
        type: edit.type,
      })
      .eq("id", transaction.id);
    setSaving(false);
    setEditing(false);
    onEdited();
  }

  if (editing) {
    return (
      <div className="border-b border-zinc-800/60 bg-zinc-800/20 px-4 py-3 sm:px-5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
          <input
            type="date"
            value={edit.date}
            onChange={(e) => setEdit((prev) => ({ ...prev, date: e.target.value }))}
            className="min-h-[44px] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-cyan-400 focus:outline-none"
          />
          <input
            type="text"
            value={edit.description}
            onChange={(e) => setEdit((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            className="min-h-[44px] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-cyan-400 focus:outline-none"
          />
          <select
            value={edit.category}
            onChange={(e) => setEdit((prev) => ({ ...prev, category: e.target.value }))}
            className="min-h-[44px] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-cyan-400 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() =>
              setEdit((prev) => ({
                ...prev,
                type: prev.type === "expense" ? "income" : "expense",
              }))
            }
            className={`min-h-[44px] rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              edit.type === "expense"
                ? "bg-red-500/10 text-red-400"
                : "bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {edit.type}
          </button>
          <input
            type="number"
            step="0.01"
            min="0"
            value={edit.amount}
            onChange={(e) => setEdit((prev) => ({ ...prev, amount: e.target.value }))}
            className="min-h-[44px] w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-right text-sm text-zinc-200 focus:border-cyan-400 focus:outline-none sm:w-24"
          />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="min-h-[44px] rounded-lg px-4 py-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-50"
          >
            {t("cancelEdit")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-h-[44px] rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 disabled:opacity-50"
          >
            {saving ? "…" : t("saveEdit")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-800/30 sm:gap-4 sm:px-5 ${
        transaction.category === "Transfer" ? "opacity-70" : ""
      }`}
    >
      {/* Date — desktop only as separate column */}
      <span className="hidden w-14 shrink-0 text-sm text-zinc-500 sm:block">
        {formatDate(transaction.date)}
      </span>

      {/* Description + mobile meta row */}
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm text-zinc-200">
          {transaction.description || transaction.category}
        </span>
        {/* Mobile: date · category badge · account below description */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:hidden">
          <span className="text-xs text-zinc-500">{formatDate(transaction.date)}</span>
          <span className="rounded-full border border-zinc-700/50 bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
            {transaction.category}
          </span>
          {transaction.account && (
            <span className="text-xs text-zinc-600">{transaction.account}</span>
          )}
        </div>
        {/* Desktop: account name below description */}
        {transaction.account && (
          <span className="mt-0.5 hidden truncate text-xs text-zinc-600 sm:block">
            {transaction.account}
          </span>
        )}
      </div>

      {/* Category badge — desktop only */}
      <span className="hidden rounded-full border border-zinc-700/50 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400 sm:block">
        {transaction.category}
      </span>

      {/* Amount */}
      <span
        className={`w-20 shrink-0 text-right text-sm font-semibold tabular-nums sm:w-24 ${
          transaction.category === "Transfer"
            ? "text-zinc-500"
            : transaction.type === "expense"
            ? "text-red-400"
            : "text-emerald-400"
        }`}
      >
        {displayAmount}
      </span>

      {/* Split */}
      {transaction.type === "expense" && (
        <Link
          href={`/dashboard/splits?new=1&txn_id=${transaction.id}&amount=${transaction.amount}&desc=${encodeURIComponent(transaction.description ?? transaction.category)}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-700/30 hover:text-cyan-400"
          title="Split this expense"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </Link>
      )}

      {/* Edit */}
      <button
        onClick={() => setEditing(true)}
        aria-label={t("editTransaction")}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-700/30 hover:text-zinc-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
        </svg>
      </button>

      {/* Delete */}
      <button
        onClick={handleDelete}
        aria-label="Delete transaction"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </button>
    </div>
  );
}

export default function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const router = useRouter();
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    setCurrency(getCurrency());
  }, []);

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 px-6 py-16 text-center">
        <p className="text-zinc-400">No transactions yet. Add your first one!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        All transactions
      </h2>
      <div className="divide-y divide-zinc-800/60 rounded-2xl border border-zinc-800/60 bg-zinc-900/50">
        {transactions.map((t) => (
          <TransactionRow
            key={t.id}
            transaction={t}
            currency={currency}
            onDeleted={() => router.refresh()}
            onEdited={() => router.refresh()}
          />
        ))}
      </div>
    </div>
  );
}
