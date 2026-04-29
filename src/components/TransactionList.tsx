"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/src/lib/supabase/client";
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

function formatAmount(t: Transaction) {
  const value = Number(t.amount).toFixed(2);
  return t.type === "expense" ? `-$${value}` : `+$${value}`;
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
  onDeleted,
  onEdited,
}: {
  transaction: Transaction;
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
      <div className="border-b border-zinc-800/60 bg-zinc-800/20 px-5 py-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
          {/* Date */}
          <input
            type="date"
            value={edit.date}
            onChange={(e) => setEdit((prev) => ({ ...prev, date: e.target.value }))}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 focus:border-cyan-400 focus:outline-none"
          />
          {/* Description */}
          <input
            type="text"
            value={edit.description}
            onChange={(e) => setEdit((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 focus:border-cyan-400 focus:outline-none"
          />
          {/* Category */}
          <select
            value={edit.category}
            onChange={(e) => setEdit((prev) => ({ ...prev, category: e.target.value }))}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 focus:border-cyan-400 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {/* Type toggle */}
          <button
            type="button"
            onClick={() =>
              setEdit((prev) => ({
                ...prev,
                type: prev.type === "expense" ? "income" : "expense",
              }))
            }
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              edit.type === "expense"
                ? "bg-red-500/10 text-red-400"
                : "bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {edit.type}
          </button>
          {/* Amount */}
          <input
            type="number"
            step="0.01"
            min="0"
            value={edit.amount}
            onChange={(e) => setEdit((prev) => ({ ...prev, amount: e.target.value }))}
            className="w-24 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-right text-sm text-zinc-200 focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-50"
          >
            {t("cancelEdit")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 disabled:opacity-50"
          >
            {saving ? "…" : t("saveEdit")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-zinc-800/30 ${
        transaction.category === "Transfer" ? "opacity-70" : ""
      }`}
    >
      {/* Date */}
      <span className="w-14 shrink-0 text-sm text-zinc-500">
        {formatDate(transaction.date)}
      </span>

      {/* Description / Category */}
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm text-zinc-200">
          {transaction.description || transaction.category}
        </span>
        {transaction.account && (
          <span className="mt-0.5 block truncate text-xs text-zinc-600">
            {transaction.account}
          </span>
        )}
      </div>

      {/* Category badge */}
      <span className="hidden rounded-full border border-zinc-700/50 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400 sm:block">
        {transaction.category}
      </span>

      {/* Amount */}
      <span
        className={`w-24 shrink-0 text-right text-sm font-semibold tabular-nums ${
          transaction.category === "Transfer"
            ? "text-zinc-500"
            : transaction.type === "expense"
            ? "text-red-400"
            : "text-emerald-400"
        }`}
      >
        {formatAmount(transaction)}
      </span>

      {/* Edit */}
      <button
        onClick={() => setEditing(true)}
        aria-label={t("editTransaction")}
        className="shrink-0 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-zinc-700/30 hover:text-zinc-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
          />
        </svg>
      </button>

      {/* Delete */}
      <button
        onClick={handleDelete}
        aria-label="Delete transaction"
        className="shrink-0 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
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
            onDeleted={() => router.refresh()}
            onEdited={() => router.refresh()}
          />
        ))}
      </div>
    </div>
  );
}
