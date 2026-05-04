import Link from "next/link";
import type { SplitWithParticipants } from "@/src/types/splits";

export default function SplitsWidget({ splits }: { splits: SplitWithParticipants[] }) {
  const active = splits.filter((s) => !s.is_settled);
  if (active.length === 0) return null;

  const totalOwed = active.reduce(
    (s, split) =>
      s + split.participants.filter((p) => !p.is_paid).reduce((a, p) => a + Number(p.amount), 0),
    0
  );

  return (
    <div className="mb-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">Splits</h2>
        <Link href="/dashboard/splits" className="text-xs text-zinc-500 hover:text-zinc-300">
          Manage →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-zinc-500">You are owed</p>
          <p className="mt-0.5 text-lg font-bold text-cyan-400">
            ${totalOwed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Active splits</p>
          <p className="mt-0.5 text-lg font-bold text-zinc-50">{active.length}</p>
        </div>
      </div>
    </div>
  );
}
