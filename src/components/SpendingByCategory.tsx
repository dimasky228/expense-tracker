"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CATEGORY_COLORS } from "@/src/lib/category-colors";

export type CategorySlice = {
  category: string;
  amount: number;
  percentage: number;
};

type TooltipEntry = { active?: boolean; payload?: { name: string; value: number }[] };

function DarkTooltip({ active, payload }: TooltipEntry) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400">{d.name}</p>
      <p className="text-sm font-semibold text-zinc-100">
        ${Number(d.value).toFixed(2)}
      </p>
    </div>
  );
}

export default function SpendingByCategory({
  data,
}: {
  data: CategorySlice[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center">
        <p className="text-sm text-zinc-500">No expenses this month</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Donut chart */}
      <div className="h-[220px] w-full shrink-0 sm:h-[220px] sm:w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius="52%"
              outerRadius="78%"
              stroke="none"
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS["Other"]}
                />
              ))}
            </Pie>
            <Tooltip content={<DarkTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="max-h-[220px] flex-1 space-y-2.5 overflow-y-auto pr-1">
        {data.map((item) => {
          const color = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS["Other"];
          return (
            <div key={item.category} className="flex items-center gap-2">
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="min-w-0 flex-1 truncate text-xs text-zinc-400">
                {item.category}
              </span>
              <span className="text-xs font-semibold text-zinc-200">
                ${item.amount.toFixed(0)}
              </span>
              <span className="w-7 text-right text-xs text-zinc-500">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
