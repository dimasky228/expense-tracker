import { CATEGORY_COLORS } from "@/src/lib/category-colors";
import type { CategorySlice } from "@/src/components/SpendingByCategory";

export default function TopSpending({ data }: { data: CategorySlice[] }) {
  if (data.length === 0) {
    return (
      <p className="py-4 text-sm text-zinc-500">No expenses this month</p>
    );
  }

  const max = data[0].amount;

  return (
    <div className="space-y-4">
      {data.map((item, i) => {
        const color = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS["Other"];
        const barWidth = max > 0 ? (item.amount / max) * 100 : 0;

        return (
          <div key={item.category} className="flex items-center gap-3">
            <span className="w-4 shrink-0 text-xs font-medium text-zinc-500">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="truncate text-sm text-zinc-300">
                  {item.category}
                </span>
                <span className="shrink-0 text-sm font-semibold text-zinc-200">
                  ${item.amount.toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%`, backgroundColor: color }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
