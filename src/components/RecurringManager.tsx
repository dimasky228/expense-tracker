"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { CATEGORY_COLORS } from "@/src/lib/category-colors";
import type { RecurringItem } from "@/src/types/recurring";
import type { DetectedRecurring } from "@/src/lib/recurring-detector";

const FREQ_LABEL: Record<RecurringItem["frequency"], string> = {
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

const CATEGORIES = [
  "Food & Dining", "Groceries", "Transport", "Housing", "Entertainment",
  "Shopping", "Health", "Utilities", "Subscriptions", "Education", "Travel", "Other",
];

const DISMISSED_KEY = "recurring_dismissed";

function loadDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]") as string[]);
  } catch { return new Set(); }
}

function saveDismissed(names: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...names]));
}

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS["Other"];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: color + "20", color }}
    >
      {category}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

type FormData = {
  name: string;
  amount: string;
  frequency: RecurringItem["frequency"];
  category: string;
  next_date: string;
  notes: string;
};

const emptyForm = (): FormData => ({
  name: "",
  amount: "",
  frequency: "monthly",
  category: "Subscriptions",
  next_date: new Date().toISOString().split("T")[0],
  notes: "",
});

export default function RecurringManager({
  initialItems,
  detected,
}: {
  initialItems: RecurringItem[];
  detected: DetectedRecurring[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);

  const activeItems = items.filter((i) => i.is_active);
  const inactiveItems = items.filter((i) => !i.is_active);
  const monthlyTotal = activeItems.reduce((s, i) => {
    if (i.frequency === "weekly") return s + i.amount * 4.33;
    if (i.frequency === "yearly") return s + i.amount / 12;
    return s + i.amount;
  }, 0);

  const visibleDetected = detected.filter(
    (d) => !dismissed.has(d.name) && !items.some((i) => i.name.toLowerCase() === d.name.toLowerCase())
  );

  function openAdd(prefill?: Partial<FormData>) {
    setEditId(null);
    setForm({ ...emptyForm(), ...prefill });
    setShowForm(true);
    setFormError("");
  }

  function openEdit(item: RecurringItem) {
    setEditId(item.id);
    setForm({
      name: item.name,
      amount: String(item.amount),
      frequency: item.frequency,
      category: item.category,
      next_date: item.next_date ?? new Date().toISOString().split("T")[0],
      notes: item.notes ?? "",
    });
    setShowForm(true);
    setFormError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm());
    setFormError("");
  }

  async function handleSave() {
    if (!form.name.trim() || !form.amount) {
      setFormError("Name and amount are required.");
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError("Enter a valid amount.");
      return;
    }

    setSaving(true);
    setFormError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setFormError("Not authenticated"); setSaving(false); return; }

    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      amount,
      frequency: form.frequency,
      category: form.category,
      next_date: form.next_date || null,
      notes: form.notes.trim() || null,
      is_active: true,
    };

    if (editId) {
      const { error } = await supabase.from("recurring").update(payload).eq("id", editId);
      if (error) { setFormError(error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("recurring").insert(payload).select().single();
      if (error) { setFormError(error.message); setSaving(false); return; }
      setItems((prev) => [...prev, data as RecurringItem]);
    }

    setSaving(false);
    closeForm();
    router.refresh();
  }

  async function toggleActive(item: RecurringItem) {
    const supabase = createClient();
    await supabase.from("recurring").update({ is_active: !item.is_active }).eq("id", item.id);
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
  }

  async function deleteItem(id: string) {
    const supabase = createClient();
    await supabase.from("recurring").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function trackDetected(d: DetectedRecurring) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from("recurring").insert({
      user_id: user.id,
      name: d.name,
      amount: d.amount,
      frequency: d.frequency,
      category: d.category,
      next_date: d.nextDate,
      is_active: true,
    }).select().single();

    if (!error && data) {
      setItems((prev) => [...prev, data as RecurringItem]);
      router.refresh();
    }
  }

  function dismiss(name: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(name);
      saveDismissed(next);
      return next;
    });
  }

  return (
    <div>
      {/* Summary */}
      {activeItems.length > 0 && (
        <div className="mb-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-400">Monthly subscription cost</p>
          <p className="mt-1 text-2xl font-bold text-zinc-50">
            ${monthlyTotal.toFixed(2)}
            <span className="ml-1 text-base font-normal text-zinc-500">/month</span>
          </p>
          <p className="mt-0.5 text-xs text-zinc-600">
            {activeItems.length} active subscription{activeItems.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Active subscriptions */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Active subscriptions
        </h2>
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-1.5 rounded-xl bg-cyan-400 px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-cyan-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Add
        </button>
      </div>

      {activeItems.length === 0 && (
        <div className="mb-8 py-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
          <p className="text-zinc-400">No subscriptions tracked yet</p>
          <p className="mt-1 text-sm text-zinc-600">Add manually or track a detected charge below</p>
        </div>
      )}

      {activeItems.length > 0 && (
        <div className="mb-8 space-y-2">
          {activeItems.map((item) => (
            <RecurringCard
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onToggle={() => toggleActive(item)}
              onDelete={() => deleteItem(item.id)}
            />
          ))}
        </div>
      )}

      {/* Paused / Canceled */}
      {inactiveItems.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Paused</h2>
          <div className="space-y-2">
            {inactiveItems.map((item) => (
              <RecurringCard
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
                onToggle={() => toggleActive(item)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Detected */}
      {visibleDetected.length > 0 && (
        <div>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Detected in your transactions
          </h2>
          <p className="mb-3 text-xs text-zinc-600">
            These look like recurring charges. Track them to keep tabs on what you're spending.
          </p>
          <div className="space-y-2">
            {visibleDetected.map((d) => (
              <div
                key={d.name}
                className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-zinc-200">{d.name}</span>
                    <CategoryBadge category={d.category} />
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    ${d.amount.toFixed(2)}/{FREQ_LABEL[d.frequency]} · {d.occurrences} charges detected
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => trackDetected(d)}
                    className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-400/20"
                  >
                    Track
                  </button>
                  <button
                    onClick={() => dismiss(d.name)}
                    className="rounded-lg px-2 py-1.5 text-xs text-zinc-600 hover:text-zinc-400"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={closeForm}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[92dvh] overflow-y-auto rounded-t-2xl border border-zinc-700/50 bg-zinc-900 p-5 sm:max-h-none sm:max-w-md sm:rounded-2xl sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-50">
                {editId ? "Edit subscription" : "Add subscription"}
              </h2>
              <button onClick={closeForm} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Name">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Netflix, Spotify, Gym…"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-50 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">$</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      placeholder="9.99"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-7 pr-3 text-sm text-zinc-50 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </Field>

                <Field label="Frequency">
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as RecurringItem["frequency"] }))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </Field>
              </div>

              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 focus:border-cyan-400 focus:outline-none"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Next charge date">
                <input
                  type="date"
                  value={form.next_date}
                  onChange={(e) => setForm((f) => ({ ...f, next_date: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 focus:border-cyan-400 focus:outline-none"
                />
              </Field>

              <Field label={<>Notes <span className="font-normal text-zinc-600">(optional)</span></>}>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Family plan, cancel before renewal"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-50 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                />
              </Field>
            </div>

            {formError && (
              <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {formError}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={closeForm}
                className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-300 disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</label>
      {children}
    </div>
  );
}

function RecurringCard({
  item,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: RecurringItem;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const days = daysUntil(item.next_date);
  const isOverdue = days !== null && days < 0;
  const isSoon = days !== null && days >= 0 && days <= 3;

  return (
    <div className={`flex items-center gap-3 rounded-xl border bg-zinc-900/50 px-4 py-3 ${item.is_active ? "border-zinc-800/60" : "border-zinc-800/30 opacity-60"}`}>
      {/* Status dot */}
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${item.is_active ? "bg-emerald-400" : "bg-zinc-600"}`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-zinc-100">{item.name}</span>
          <CategoryBadge category={item.category} />
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-300">
            ${Number(item.amount).toFixed(2)}/{FREQ_LABEL[item.frequency]}
          </span>
          {item.next_date && (
            <>
              <span>·</span>
              <span className={isOverdue ? "text-red-400" : isSoon ? "text-amber-400" : ""}>
                {isOverdue
                  ? `overdue by ${Math.abs(days!)}d`
                  : days === 0
                  ? "due today"
                  : days === 1
                  ? "due tomorrow"
                  : isSoon
                  ? `due in ${days}d`
                  : `next: ${formatDate(item.next_date)}`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={onEdit}
          className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
          title="Edit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
          </svg>
        </button>
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
          title={item.is_active ? "Pause" : "Resume"}
        >
          {item.is_active ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
          )}
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-1.5 text-zinc-700 hover:bg-zinc-800 hover:text-red-400"
          title="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}
