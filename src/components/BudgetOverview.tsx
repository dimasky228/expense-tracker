import Link from "next/link";
import { CATEGORY_COLORS } from "@/src/lib/category-colors";
import type { BudgetStatus } from "@/src/lib/budgets";

function progressBarColor(status: BudgetStatus["status"]) {
  if (status === "over") return "bg-red-500";
  if (status === "danger") return "bg-red-400";
  if (status === "warning") return "bg-amber-400";
  return "bg-emerald-400";
}

function progressTrackColor(status: BudgetStatus["status"]) {
  if (status === "over" || status === "danger") return "bg-red-400/15";
  if (status === "warning") return "bg-amber-400/15";
  return "bg-emerald-400/15";
}

export default function BudgetOverview({ statuses }: { statuses: BudgetStatus[] }) {
  if (statuses.length === 0) return null;

  // Show top 3 most critical: over first, then by percentage desc
  const sorted = [...statuses].sort((a, b) => b.percentage - a.percentage);
  const top3 = sorted.slice(0, 3);
  const hasWarning = statuses.some((s) => s.percentage >= 90);

  return (
    <div className="mb-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-300">Budget Overview</h2>
          {hasWarning && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4 text-amber-400"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          )}
        </div>
        <Link
          href="/dashboard/budgets"
          className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-3">
        {top3.map((s) => {
          const pct = Math.min(s.percentage, 100);
          const color = CATEGORY_COLORS[s.category] ?? CATEGORY_COLORS["Other"];
          return (
            <div key={s.category}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-zinc-300">{s.category}</span>
                  {s.status === "over" && (
                    <span className="text-xs text-red-400">over</span>
                  )}
                </div>
                <span className="text-xs text-zinc-500">
                  ${s.spent.toFixed(0)} / ${s.budget.toFixed(0)}
                </span>
              </div>
              <div className={`h-1.5 w-full overflow-hidden rounded-full ${progressTrackColor(s.status)}`}>
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${progressBarColor(s.status)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {statuses.length > 3 && (
        <p className="mt-3 text-xs text-zinc-600">
          +{statuses.length - 3} more budget{statuses.length - 3 !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
