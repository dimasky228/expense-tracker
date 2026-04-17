import type { Insight } from "@/src/types/insights";

const ICONS: Record<string, string> = {
  subscription: "🔄",
  anomaly: "⚠️",
  pattern: "📊",
  saving: "💰",
  positive: "✅",
};

const BORDER: Record<string, string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-emerald-500",
};

export default function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div
      className={`rounded-xl border border-zinc-800 border-l-4 ${
        BORDER[insight.priority] ?? "border-l-zinc-600"
      } bg-zinc-900 p-4`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden="true">
          {ICONS[insight.type] ?? "💡"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <p className="text-sm font-semibold text-zinc-100">{insight.title}</p>
            {insight.amount != null && (
              <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-300">
                ${Number(insight.amount).toFixed(2)}/mo
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
            {insight.description}
          </p>
        </div>
      </div>
    </div>
  );
}
