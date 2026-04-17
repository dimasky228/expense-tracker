"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

export type MonthBar = { month: string; amount: number };

type TooltipEntry = { active?: boolean; payload?: { value: number }[]; label?: string };

function DarkTooltip({ active, payload, label }: TooltipEntry) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-sm font-semibold text-zinc-100">
        ${Number(payload[0].value).toFixed(2)}
      </p>
    </div>
  );
}

function fmtTick(v: number) {
  if (v === 0) return "$0";
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v}`;
}

export default function MonthlyTrend({
  data,
  currentMonth,
}: {
  data: MonthBar[];
  currentMonth: string;
}) {
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barSize={28}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        >
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickFormatter={fmtTick}
            width={48}
          />
          <Tooltip
            content={<DarkTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.month}
                fill={entry.month === currentMonth ? "#22d3ee" : "#3f3f46"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
