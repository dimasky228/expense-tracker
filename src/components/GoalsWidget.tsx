import Link from "next/link";
import type { Goal } from "@/src/types/goals";

function pct(goal: Goal) {
  if (goal.target_amount <= 0) return 0;
  return Math.min(100, (goal.current_amount / goal.target_amount) * 100);
}

export default function GoalsWidget({ goals }: { goals: Goal[] }) {
  const active = goals.filter((g) => !g.is_completed);
  if (active.length === 0) {
    return (
      <div className="mb-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Goals</h2>
          <Link href="/dashboard/goals" className="text-xs text-zinc-500 hover:text-zinc-300">
            Manage →
          </Link>
        </div>
        <p className="text-sm text-zinc-500">No active goals yet.</p>
        <Link href="/dashboard/goals" className="mt-3 inline-block text-xs font-medium text-cyan-400 hover:text-cyan-300">
          Set your first goal →
        </Link>
      </div>
    );
  }

  const top = active
    .slice()
    .sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline < b.deadline ? -1 : 1;
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return pct(b) - pct(a);
    })
    .slice(0, 2);

  return (
    <div className="mb-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">Goals</h2>
        <Link href="/dashboard/goals" className="text-xs text-zinc-500 hover:text-zinc-300">
          View all →
        </Link>
      </div>
      <div className="space-y-4">
        {top.map((g) => {
          const p = pct(g);
          return (
            <div key={g.id}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{g.icon}</span>
                  <span className="text-sm text-zinc-200">{g.name}</span>
                </div>
                <span className="text-xs font-medium" style={{ color: g.color }}>{p.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${p}%`, background: g.color }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-zinc-500">
                <span>${g.current_amount.toLocaleString()}</span>
                <span>${g.target_amount.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
