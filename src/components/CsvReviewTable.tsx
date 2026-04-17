"use client";

import { useState } from "react";
import type { CategorizedTransaction } from "@/src/types/transaction";

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

function fmtDate(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CsvReviewTable({
  transactions: initial,
  saving,
  saveError,
  onSave,
  onCancel,
}: {
  transactions: CategorizedTransaction[];
  saving: boolean;
  saveError: string;
  onSave: (transactions: CategorizedTransaction[]) => void;
  onCancel: () => void;
}) {
  const [rows, setRows] = useState<CategorizedTransaction[]>(initial);

  function updateCategory(i: number, category: string) {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, category } : r))
    );
  }

  function toggleType(i: number) {
    setRows((prev) =>
      prev.map((r, idx) =>
        idx === i
          ? { ...r, type: r.type === "expense" ? "income" : "expense" }
          : r
      )
    );
  }

  const expenseCount = rows.filter((r) => r.type === "expense").length;
  const incomeCount = rows.length - expenseCount;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <p className="text-sm text-zinc-400">
        <span className="font-semibold text-zinc-200">{rows.length}</span>{" "}
        transactions found ·{" "}
        <span className="text-red-400">{expenseCount} expenses</span> ·{" "}
        <span className="text-emerald-400">{incomeCount} income</span>
      </p>

      {/* Table */}
      <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-zinc-700/60">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-800 text-left">
            <tr>
              {["Date", "Description", "Category", "Type", "Amount"].map((h) => (
                <th
                  key={h}
                  className="border-b border-zinc-700/60 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-zinc-800/30">
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-zinc-400">
                  {fmtDate(row.date)}
                </td>
                <td className="max-w-[180px] truncate px-3 py-2.5 text-zinc-200">
                  {row.description}
                </td>
                <td className="px-3 py-2.5">
                  <select
                    value={row.category}
                    onChange={(e) => updateCategory(i, e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:border-cyan-400 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleType(i)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                      row.type === "expense"
                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    }`}
                  >
                    {row.type}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums">
                  <span
                    className={
                      row.type === "expense" ? "text-red-400" : "text-emerald-400"
                    }
                  >
                    {row.type === "expense" ? "-" : "+"}${row.amount.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {saveError && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {saveError}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(rows)}
          disabled={saving}
          className="flex-1 rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : `Save ${rows.length} transactions`}
        </button>
      </div>
    </div>
  );
}
