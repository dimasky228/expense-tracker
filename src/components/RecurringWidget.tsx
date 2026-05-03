import Link from "next/link";
import type { RecurringItem } from "@/src/types/recurring";

function toMonthly(item: RecurringItem): number {
  if (item.frequency === "weekly") return item.amount * 4.33;
  if (item.frequency === "yearly") return item.amount / 12;
  return item.amount;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RecurringWidget({ items }: { items: RecurringItem[] }) {
  const active = items.filter((i) => i.is_active);
  if (active.length === 0) return null;

  const monthlyTotal = active.reduce((s, i) => s + toMonthly(i), 0);

  // Next upcoming charge
  const withDate = active
    .filter((i) => i.next_date)
    .sort((a, b) => (a.next_date! > b.next_date! ? 1 : -1));
  const next = withDate[0] ?? null;

  const daysUntilNext = next?.next_date
    ? Math.ceil(
        (new Date(next.next_date + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="mb-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">Subscriptions</h2>
        <Link href="/dashboard/recurring" className="text-xs text-zinc-500 hover:text-zinc-300">
          Manage →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-zinc-500">Monthly cost</p>
          <p className="mt-0.5 text-lg font-bold text-zinc-50">${monthlyTotal.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Active</p>
          <p className="mt-0.5 text-lg font-bold text-zinc-50">{active.length}</p>
        </div>
        {next && (
          <div>
            <p className="text-xs text-zinc-500">Next charge</p>
            <p className={`mt-0.5 text-sm font-semibold ${daysUntilNext !== null && daysUntilNext <= 3 ? "text-amber-400" : "text-zinc-200"}`}>
              {next.name}
            </p>
            <p className="text-xs text-zinc-500">
              {formatDate(next.next_date!)}
              {daysUntilNext !== null &&
                (daysUntilNext === 0
                  ? " · today"
                  : daysUntilNext === 1
                  ? " · tomorrow"
                  : daysUntilNext > 0 && daysUntilNext <= 7
                  ? ` · in ${daysUntilNext}d`
                  : "")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
