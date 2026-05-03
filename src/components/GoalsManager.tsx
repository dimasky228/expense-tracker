"use client";

import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import type { Goal } from "@/src/types/goals";

const ICONS = ["🎯", "🏠", "🚗", "✈️", "💰", "🎓", "💍", "📱", "🏖️", "🐾"];
const COLORS = ["#22d3ee", "#34d399", "#a78bfa", "#fbbf24", "#f472b6", "#f87171"];

function pct(goal: Goal) {
  if (goal.target_amount <= 0) return 0;
  return Math.min(100, (goal.current_amount / goal.target_amount) * 100);
}

function formatAmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function estCompletion(goal: Goal, avgMonthlySavings: number): string | null {
  if (goal.is_completed || avgMonthlySavings <= 0) return null;
  const remaining = goal.target_amount - goal.current_amount;
  if (remaining <= 0) return null;
  const months = remaining / avgMonthlySavings;
  const d = new Date();
  d.setMonth(d.getMonth() + Math.ceil(months));
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function CelebrationOverlay({ goal, onDismiss }: { goal: Goal; onDismiss: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onDismiss}
    >
      <div className="flex flex-col items-center gap-4 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="text-7xl animate-bounce">{goal.icon}</div>
        <div className="text-5xl">🎉</div>
        <p className="text-2xl font-bold text-zinc-50">Goal achieved!</p>
        <p className="text-zinc-400">{goal.name} is complete</p>
        <button
          onClick={onDismiss}
          className="mt-2 rounded-full bg-cyan-500 px-6 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  avgMonthlySavings,
  onFund,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  avgMonthlySavings: number;
  onFund: (g: Goal) => void;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
}) {
  const p = pct(goal);
  const est = estCompletion(goal, avgMonthlySavings);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
        style={{ background: goal.color, width: `${p}%`, minWidth: p > 0 ? "4px" : 0 }}
      />
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{goal.icon}</span>
          <div>
            <p className="font-semibold text-zinc-100 leading-tight">{goal.name}</p>
            {goal.is_completed && (
              <span className="text-xs font-medium text-emerald-400">✓ Completed</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(goal)} className="rounded p-1 text-zinc-500 hover:text-zinc-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
          <button onClick={() => onDelete(goal.id)} className="rounded p-1 text-zinc-500 hover:text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${p}%`, background: goal.color }}
        />
      </div>

      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-zinc-300">${formatAmt(goal.current_amount)}</span>
        <span className="font-semibold" style={{ color: goal.color }}>{p.toFixed(0)}%</span>
        <span className="text-zinc-500">${formatAmt(goal.target_amount)}</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        {goal.deadline && (
          <span>Deadline: {new Date(goal.deadline + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        )}
        {est && <span>Est. done: {est}</span>}
      </div>

      {!goal.is_completed && (
        <button
          onClick={() => onFund(goal)}
          className="w-full rounded-lg py-1.5 text-sm font-medium transition-colors hover:opacity-90"
          style={{ background: goal.color + "22", color: goal.color, border: `1px solid ${goal.color}44` }}
        >
          + Add funds
        </button>
      )}
    </div>
  );
}

const emptyForm = { name: "", target_amount: "", current_amount: "0", deadline: "", icon: "🎯", color: "#22d3ee" };

export default function GoalsManager({ initialGoals, avgMonthlySavings }: { initialGoals: Goal[]; avgMonthlySavings: number }) {
  const supabase = createClient();
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [showAdd, setShowAdd] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [fundGoal, setFundGoal] = useState<Goal | null>(null);
  const [celebrating, setCelebrating] = useState<Goal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [fundAmount, setFundAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const active = goals.filter((g) => !g.is_completed);
  const completed = goals.filter((g) => g.is_completed);

  function openAdd() { setForm(emptyForm); setShowAdd(true); }
  function openEdit(g: Goal) {
    setForm({ name: g.name, target_amount: String(g.target_amount), current_amount: String(g.current_amount), deadline: g.deadline ?? "", icon: g.icon, color: g.color });
    setEditGoal(g);
  }

  async function handleSave() {
    if (!form.name || !form.target_amount) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount || "0"),
      deadline: form.deadline || null,
      icon: form.icon,
      color: form.color,
      is_completed: false,
      updated_at: new Date().toISOString(),
    };
    if (editGoal) {
      const { data } = await supabase.from("goals").update(payload).eq("id", editGoal.id).select().single();
      if (data) setGoals((prev) => prev.map((g) => (g.id === editGoal.id ? (data as Goal) : g)));
      setEditGoal(null);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("goals").insert({ ...payload, user_id: user!.id }).select().single();
      if (data) setGoals((prev) => [...prev, data as Goal]);
      setShowAdd(false);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("goals").delete().eq("id", id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  async function handleAddFunds() {
    if (!fundGoal || !fundAmount) return;
    setSaving(true);
    const newAmt = Math.min(fundGoal.target_amount, fundGoal.current_amount + parseFloat(fundAmount));
    const isNowComplete = newAmt >= fundGoal.target_amount;
    const { data } = await supabase
      .from("goals")
      .update({ current_amount: newAmt, is_completed: isNowComplete, updated_at: new Date().toISOString() })
      .eq("id", fundGoal.id)
      .select()
      .single();
    if (data) {
      setGoals((prev) => prev.map((g) => (g.id === fundGoal.id ? (data as Goal) : g)));
      if (isNowComplete) setCelebrating(data as Goal);
    }
    setFundGoal(null);
    setFundAmount("");
    setSaving(false);
  }

  const modalOpen = showAdd || !!editGoal || !!fundGoal;

  return (
    <div>
      {celebrating && <CelebrationOverlay goal={celebrating} onDismiss={() => setCelebrating(null)} />}

      {avgMonthlySavings > 0 && (
        <div className="mb-6 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4 flex items-center gap-3">
          <span className="text-zinc-400 text-2xl">💡</span>
          <p className="text-sm text-zinc-400">
            Your average monthly savings: <span className="font-semibold text-zinc-200">${formatAmt(avgMonthlySavings)}</span>
          </p>
        </div>
      )}

      {active.length === 0 && completed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 p-12 text-center">
          <p className="text-3xl mb-3">🎯</p>
          <p className="text-zinc-300 font-medium mb-1">No goals yet</p>
          <p className="text-sm text-zinc-500 mb-4">Set a savings target and track your progress</p>
          <button onClick={openAdd} className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400">
            Add your first goal
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {active.map((g) => (
              <GoalCard key={g.id} goal={g} avgMonthlySavings={avgMonthlySavings} onFund={setFundGoal} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
          <button onClick={openAdd} className="mt-4 w-full rounded-xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors">
            + Add goal
          </button>
          {completed.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Completed</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 opacity-60">
                {completed.map((g) => (
                  <GoalCard key={g.id} goal={g} avgMonthlySavings={0} onFund={setFundGoal} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {(showAdd || !!editGoal) && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => { setShowAdd(false); setEditGoal(null); }}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-5 text-lg font-bold text-zinc-50">{editGoal ? "Edit goal" : "New goal"}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Goal name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Emergency fund" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Target amount</label>
                  <input type="number" value={form.target_amount} onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))} placeholder="10000" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Already saved</label>
                  <input type="number" value={form.current_amount} onChange={(e) => setForm((f) => ({ ...f, current_amount: e.target.value }))} placeholder="0" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Deadline (optional)</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((ic) => (
                    <button key={ic} onClick={() => setForm((f) => ({ ...f, icon: ic }))} className={`rounded-lg p-1.5 text-xl transition-colors ${form.icon === ic ? "bg-zinc-700 ring-1 ring-cyan-500" : "hover:bg-zinc-800"}`}>{ic}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))} className={`h-7 w-7 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-white ring-offset-1 ring-offset-zinc-900" : "hover:scale-110"}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => { setShowAdd(false); setEditGoal(null); }} className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.target_amount} className="flex-1 rounded-lg bg-cyan-500 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400 disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {fundGoal && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => { setFundGoal(null); setFundAmount(""); }}>
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <span className="text-3xl">{fundGoal.icon}</span>
              <div>
                <h2 className="font-bold text-zinc-50">Add funds</h2>
                <p className="text-xs text-zinc-400">{fundGoal.name}</p>
              </div>
            </div>
            <div className="mb-2 flex justify-between text-sm text-zinc-400">
              <span>Current: ${formatAmt(fundGoal.current_amount)}</span>
              <span>Target: ${formatAmt(fundGoal.target_amount)}</span>
            </div>
            <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full" style={{ width: `${pct(fundGoal)}%`, background: fundGoal.color }} />
            </div>
            <label className="mb-1 block text-xs text-zinc-400">Amount to add</label>
            <input
              type="number"
              autoFocus
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddFunds()}
              placeholder="0"
              className="mb-5 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500"
            />
            <div className="flex gap-3">
              <button onClick={() => { setFundGoal(null); setFundAmount(""); }} className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
              <button onClick={handleAddFunds} disabled={saving || !fundAmount} className="flex-1 rounded-lg bg-cyan-500 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400 disabled:opacity-50">
                {saving ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && <div className="fixed inset-0 z-30" />}
    </div>
  );
}
