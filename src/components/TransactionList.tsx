"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import type { Transaction } from "@/src/types/transaction";

function formatDate(dateStr: string) {
  // Append time to avoid UTC-to-local shift on date-only strings
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatAmount(t: Transaction) {
  const value = Number(t.amount).toFixed(2);
  return t.type === "expense" ? `-$${value}` : `+$${value}`;
}

export default function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this transaction?")) return;
    const supabase = createClient();
    await supabase.from("transactions").delete().eq("id", id);
    router.refresh();
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 px-6 py-16 text-center">
        <p className="text-zinc-400">
          No transactions yet. Add your first one!
        </p>
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
          <div
            key={t.id}
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-zinc-800/30"
          >
            {/* Date */}
            <span className="w-14 shrink-0 text-sm text-zinc-500">
              {formatDate(t.date)}
            </span>

            {/* Description / Category */}
            <span className="flex-1 truncate text-sm text-zinc-200">
              {t.description || t.category}
            </span>

            {/* Category badge */}
            <span className="hidden rounded-full border border-zinc-700/50 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400 sm:block">
              {t.category}
            </span>

            {/* Amount */}
            <span
              className={`w-24 shrink-0 text-right text-sm font-semibold tabular-nums ${
                t.type === "expense" ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {formatAmount(t)}
            </span>

            {/* Delete */}
            <button
              onClick={() => handleDelete(t.id)}
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
        ))}
      </div>
    </div>
  );
}
