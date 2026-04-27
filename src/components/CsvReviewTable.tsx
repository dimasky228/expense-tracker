"use client";

import { useState } from "react";
import type { CategorizedTransaction, PotentialTransfer } from "@/src/types/transaction";

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

function fmtAmt(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function CsvReviewTable({
  transactions: initial,
  duplicateCount,
  duplicates,
  potentialTransfers,
  saving,
  saveError,
  onSave,
  onCancel,
}: {
  transactions: CategorizedTransaction[];
  duplicateCount: number;
  duplicates: { date: string; description: string; amount: number }[];
  potentialTransfers: PotentialTransfer[];
  saving: boolean;
  saveError: string;
  onSave: (transactions: CategorizedTransaction[]) => void;
  onCancel: () => void;
}) {
  const [rows, setRows] = useState<CategorizedTransaction[]>(initial);
  // hash → true means user chose "Mark as Transfer"
  const [transferDecisions, setTransferDecisions] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(potentialTransfers.map((t) => [t.importedHash, true]))
  );
  const [showDuplicates, setShowDuplicates] = useState(false);

  function updateCategory(i: number, category: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, category } : r)));
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

  function handleSave() {
    const finalRows = rows.map((row) => {
      if (row.importHash && transferDecisions[row.importHash] === true) {
        return { ...row, category: "Transfer" };
      }
      return row;
    });
    onSave(finalRows);
  }

  const expenseCount = rows.filter(
    (r) => r.type === "expense" && r.category !== "Transfer"
  ).length;
  const incomeCount = rows.filter((r) => r.type === "income").length;
  const transferCount = potentialTransfers.filter(
    (t) => transferDecisions[t.importedHash]
  ).length;

  // Map hash → transfer info for display
  const transferByHash = new Map(potentialTransfers.map((t) => [t.importedHash, t]));

  return (
    <div className="flex flex-col gap-4">
      {/* ── Summary banner ── */}
      <div className="rounded-xl border border-zinc-700/60 bg-zinc-800/40 px-4 py-3">
        <p className="text-sm text-zinc-300">
          <span className="font-semibold text-zinc-100">{rows.length} new</span>
          {duplicateCount > 0 && (
            <>
              {" · "}
              <span className="text-amber-400">{duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""} skipped</span>
            </>
          )}
          {potentialTransfers.length > 0 && (
            <>
              {" · "}
              <span className="text-cyan-400">{potentialTransfers.length} potential transfer{potentialTransfers.length !== 1 ? "s" : ""}</span>
            </>
          )}
          {rows.length > 0 && (
            <>
              {" · "}
              <span className="text-red-400">{expenseCount} expense{expenseCount !== 1 ? "s" : ""}</span>
              {" · "}
              <span className="text-emerald-400">{incomeCount} income</span>
            </>
          )}
        </p>
      </div>

      {/* ── Duplicates section ── */}
      {duplicateCount > 0 && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5">
          <button
            type="button"
            onClick={() => setShowDuplicates((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-amber-400">
              {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""} already in your account — skipped
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`h-4 w-4 text-amber-400 transition-transform ${showDuplicates ? "rotate-180" : ""}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </button>
          {showDuplicates && duplicates.length > 0 && (
            <div className="divide-y divide-amber-400/10 border-t border-amber-400/20 px-4 pb-3">
              {duplicates.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-xs text-zinc-500">
                  <span>{fmtDate(d.date)}</span>
                  <span className="flex-1 truncate px-3">{d.description}</span>
                  <span className="tabular-nums">{fmtAmt(d.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Potential transfers section ── */}
      {potentialTransfers.length > 0 && (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3">
          <p className="mb-3 text-sm font-medium text-cyan-400">
            {potentialTransfers.length} potential internal transfer{potentialTransfers.length !== 1 ? "s" : ""} detected
          </p>
          <div className="space-y-2">
            {potentialTransfers.map((tr) => {
              const importedRow = rows.find((r) => r.importHash === tr.importedHash);
              const isTransfer = transferDecisions[tr.importedHash] ?? true;
              return (
                <div
                  key={tr.importedHash}
                  className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-3"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="font-medium text-zinc-200">
                      {fmtDate(importedRow?.date ?? tr.existingDate)}
                    </span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5">
                      {importedRow?.account || "this import"}
                    </span>
                    <span className="text-red-400 font-semibold">
                      −{fmtAmt(importedRow?.amount ?? tr.existingAmount)}
                    </span>
                    <span className="text-zinc-600">↔</span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5">
                      {tr.existingAccount}
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      +{fmtAmt(tr.existingAmount)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setTransferDecisions((prev) => ({
                          ...prev,
                          [tr.importedHash]: true,
                        }))
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isTransfer
                          ? "bg-cyan-400/20 text-cyan-400 ring-1 ring-cyan-400/40"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Mark as transfer
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTransferDecisions((prev) => ({
                          ...prev,
                          [tr.importedHash]: false,
                        }))
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        !isTransfer
                          ? "bg-zinc-700 text-zinc-200 ring-1 ring-zinc-500"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Keep separate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {transferCount > 0 && (
            <p className="mt-2 text-xs text-zinc-500">
              Transfers won&apos;t count toward your spending totals.
            </p>
          )}
        </div>
      )}

      {/* ── New transactions table ── */}
      {rows.length > 0 && (
        <div className="max-h-[42vh] overflow-y-auto rounded-xl border border-zinc-700/60">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-800 text-left">
              <tr>
                {["Date", "Description", "Account", "Category", "Type", "Amount"].map((h) => (
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
              {rows.map((row, i) => {
                const isTransferRow =
                  row.importHash &&
                  transferByHash.has(row.importHash) &&
                  transferDecisions[row.importHash];
                return (
                  <tr
                    key={i}
                    className={`hover:bg-zinc-800/30 ${isTransferRow ? "opacity-60" : ""}`}
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-zinc-400">
                      {fmtDate(row.date)}
                    </td>
                    <td className="max-w-[150px] truncate px-3 py-2.5 text-zinc-200">
                      {row.description}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.account ? (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                          {row.account}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={isTransferRow ? "Transfer" : row.category}
                        onChange={(e) => updateCategory(i, e.target.value)}
                        disabled={!!isTransferRow}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:border-cyan-400 focus:outline-none disabled:opacity-50"
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
                        disabled={!!isTransferRow}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
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
                        {row.type === "expense" ? "−" : "+"}
                        {fmtAmt(row.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows.length === 0 && (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 py-8 text-center">
          <p className="text-sm text-zinc-500">All transactions were already imported.</p>
        </div>
      )}

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
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving…"
            : rows.length === 0
            ? "Done"
            : `Save ${rows.length} transaction${rows.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
