"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { CATEGORY_COLORS } from "@/src/lib/category-colors";
import type { BudgetStatus } from "@/src/lib/budgets";

const ALL_EXPENSE_CATEGORIES = [
  "Food & Dining", "Groceries", "Transport", "Housing", "Entertainment",
  "Shopping", "Health", "Utilities", "Subscriptions", "Education", "Travel", "Other",
];

function progressColor(status: BudgetStatus["status"]) {
  if (status === "over") return "bg-red-500";
  if (status === "danger") return "bg-red-400";
  if (status === "warning") return "bg-amber-400";
  return "bg-emerald-400";
}

function progressTrackColor(status: BudgetStatus["status"]) {
  if (status === "over") return "bg-red-500/20";
  if (status === "danger") return "bg-red-400/20";
  if (status === "warning") return "bg-amber-400/20";
  return "bg-emerald-400/20";
}

function CategoryDot({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS["Other"];
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

export default function BudgetManager({
  initialStatuses,
  unbudgeted,
}: {
  initialStatuses: BudgetStatus[];
  unbudgeted: { category: string; spent: number }[];
}) {
  const router = useRouter();
  const [statuses, setStatuses] = useState(initialStatuses);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addCategory, setAddCategory] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const budgetedCategories = new Set(statuses.map((s) => s.category));
  const availableCategories = ALL_EXPENSE_CATEGORIES.filter(
    (c) => !budgetedCategories.has(c)
  );
  const quickAddCategories = unbudgeted.filter((u) => !budgetedCategories.has(u.category));

  async function saveBudget(category: string, amount: number) {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setSaving(false); return; }

    const { error: dbErr } = await supabase.from("budgets").upsert(
      { user_id: user.id, category, amount, updated_at: new Date().toISOString() },
      { onConflict: "user_id,category" }
    );

    if (dbErr) { setError(dbErr.message); setSaving(false); return; }

    setSaving(false);
    setEditingCategory(null);
    setShowAddForm(false);
    setAddCategory("");
    setAddAmount("");
    router.refresh();
  }

  async function deleteBudget(category: string) {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from("budgets").delete()
      .eq("user_id", user.id)
      .eq("category", category);

    setStatuses((prev) => prev.filter((s) => s.category !== category));
    setSaving(false);
    router.refresh();
  }

  function startEdit(status: BudgetStatus) {
    setEditingCategory(status.category);
    setEditAmount(String(status.budget));
    setShowAddForm(false);
  }

  function openAddForm(category = "") {
    setShowAddForm(true);
    setAddCategory(category || (availableCategories[0] ?? ""));
    setAddAmount("");
    setEditingCategory(null);
  }

  return (
    <div>
      {/* Budget cards */}
      {statuses.length > 0 && (
        <div className="mb-8 space-y-3">
          {statuses.map((s) => {
            const pct = Math.min(s.percentage, 100);
            const isOver = s.status === "over";
            const isEditing = editingCategory === s.category;

            return (
              <div
                key={s.category}
                className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4 sm:p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <CategoryDot category={s.category} />
                    <span className="truncate font-medium text-zinc-100">{s.category}</span>
                    {isOver && (
                      <span className="shrink-0 animate-pulse rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
                        Over budget
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(s)}
                        className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
                        title="Edit budget"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => deleteBudget(s.category)}
                      disabled={saving}
                      className="rounded-lg p-1.5 text-zinc-700 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
                      title="Delete budget"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className={`h-2 w-full overflow-hidden rounded-full ${progressTrackColor(s.status)}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor(s.status)} ${isOver ? "animate-pulse" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-400">
                    ${s.spent.toFixed(0)}{" "}
                    <span className="text-zinc-600">/ ${s.budget.toFixed(0)}</span>
                  </span>
                  <span className={
                    isOver ? "font-medium text-red-400" :
                    s.status === "danger" ? "text-red-400" :
                    s.status === "warning" ? "text-amber-400" :
                    "text-zinc-500"
                  }>
                    {isOver
                      ? `-$${(s.spent - s.budget).toFixed(0)} over`
                      : `$${(s.budget - s.spent).toFixed(0)} left · ${s.percentage.toFixed(0)}%`}
                  </span>
                </div>

                {/* Inline edit form */}
                {isEditing && (
                  <div className="mt-3 flex items-center gap-2 border-t border-zinc-800 pt-3">
                    <span className="text-sm text-zinc-400">New limit:</span>
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">$</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        autoFocus
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editAmount) saveBudget(s.category, parseFloat(editAmount));
                          if (e.key === "Escape") setEditingCategory(null);
                        }}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-7 pr-3 text-sm text-zinc-50 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => editAmount && saveBudget(s.category, parseFloat(editAmount))}
                      disabled={saving || !editAmount}
                      className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-300 disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add budget button / form */}
      {availableCategories.length > 0 && !showAddForm && (
        <button
          onClick={() => openAddForm()}
          className="mb-8 flex items-center gap-2 rounded-2xl border border-dashed border-zinc-700 px-5 py-4 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add budget
        </button>
      )}

      {showAddForm && (
        <div className="mb-8 rounded-2xl border border-zinc-700 bg-zinc-900/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-200">New budget</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Category</label>
              <select
                value={addCategory}
                onChange={(e) => setAddCategory(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 focus:border-cyan-400 focus:outline-none"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-40">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Monthly limit</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">$</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  autoFocus
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && addCategory && addAmount)
                      saveBudget(addCategory, parseFloat(addAmount));
                    if (e.key === "Escape") setShowAddForm(false);
                  }}
                  placeholder="500"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-7 pr-3 text-sm text-zinc-50 placeholder-zinc-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addCategory && addAmount && saveBudget(addCategory, parseFloat(addAmount))}
                disabled={saving || !addCategory || !addAmount}
                className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-cyan-300 disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>
      )}

      {/* Unbudgeted categories */}
      {quickAddCategories.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Categories without budgets
          </h2>
          <div className="space-y-2">
            {quickAddCategories.map((u) => (
              <div
                key={u.category}
                className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-4 py-3"
              >
                <CategoryDot category={u.category} />
                <span className="flex-1 text-sm text-zinc-400">{u.category}</span>
                <span className="text-sm text-zinc-500">${u.spent.toFixed(0)} this month</span>
                <button
                  onClick={() => openAddForm(u.category)}
                  className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                >
                  Set budget
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {statuses.length === 0 && quickAddCategories.length === 0 && !showAddForm && (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="text-zinc-400">No budgets yet</p>
          <p className="mt-1 text-sm text-zinc-600">Add your first budget to track category spending</p>
          <button
            onClick={() => openAddForm()}
            className="mt-4 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-cyan-300"
          >
            + Add budget
          </button>
        </div>
      )}
    </div>
  );
}
