"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import type { SplitWithParticipants, SplitParticipant } from "@/src/types/splits";
import type { Transaction } from "@/src/types/transaction";

type Prefill = { txn_id: string | null; amount: string; desc: string } | null;
type LocalParticipant = { uid: string; name: string; amount: string };

function fmtAmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getEqualShare(total: string, othersCount: number): string {
  const t = parseFloat(total) || 0;
  if (othersCount === 0) return "0.00";
  const totalPeople = othersCount + 1;
  const cents = Math.floor(Math.round(t * 100) / totalPeople);
  return (cents / 100).toFixed(2);
}

function getUserShare(total: string, participants: LocalParticipant[]): number {
  const t = parseFloat(total) || 0;
  const sum = participants.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  return Math.max(0, Math.round((t - sum) * 100) / 100);
}

function newParticipant(): LocalParticipant {
  return { uid: Math.random().toString(36).slice(2), name: "", amount: "0.00" };
}

function SplitCard({
  split,
  onMarkPaid,
  onSettleAll,
  onDelete,
}: {
  split: SplitWithParticipants;
  onMarkPaid: (participantId: string) => Promise<void>;
  onSettleAll: (splitId: string) => Promise<void>;
  onDelete: (splitId: string) => Promise<void>;
}) {
  const unpaid = split.participants.filter((p) => !p.is_paid);
  const owed = unpaid.reduce((s, p) => s + Number(p.amount), 0);
  const allPaid = split.participants.length > 0 && unpaid.length === 0;

  return (
    <div className={`rounded-2xl border bg-zinc-900/50 p-5 ${split.is_settled ? "border-zinc-800/40 opacity-60" : "border-zinc-800/60"}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {split.is_settled && <span className="text-emerald-400 text-sm">✓</span>}
            <p className="font-semibold text-zinc-100">{split.description}</p>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{fmtDate(split.date)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-zinc-100">${fmtAmt(Number(split.total_amount))}</p>
          {!split.is_settled && owed > 0 && (
            <p className="text-xs text-cyan-400">Owed: ${fmtAmt(owed)}</p>
          )}
        </div>
      </div>

      <div className="mb-3 space-y-1.5">
        {split.participants.map((p) => (
          <div key={p.id} className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full shrink-0 ${p.is_paid ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className="flex-1 text-sm text-zinc-300">{p.name}</span>
            <span className="text-sm tabular-nums text-zinc-400">${fmtAmt(Number(p.amount))}</span>
            {!p.is_paid && !split.is_settled && (
              <button
                onClick={() => onMarkPaid(p.id)}
                className="rounded-full border border-emerald-500/40 px-2 py-0.5 text-xs text-emerald-400 hover:bg-emerald-500/10"
              >
                Mark paid
              </button>
            )}
            {p.is_paid && <span className="text-xs text-emerald-500">Paid</span>}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
        <p className="text-xs text-zinc-500">
          {split.participants.filter((p) => p.is_paid).length}/{split.participants.length} paid
          {split.transaction_id && <span className="ml-2 rounded-full bg-zinc-800 px-1.5 py-0.5">linked</span>}
        </p>
        <div className="flex gap-2">
          {allPaid && !split.is_settled && (
            <button
              onClick={() => onSettleAll(split.id)}
              className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/25"
            >
              Settle all
            </button>
          )}
          <button
            onClick={() => onDelete(split.id)}
            className="rounded-full px-2 py-1 text-xs text-zinc-600 hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const today = new Date().toISOString().split("T")[0]!;

const emptyForm1 = { description: "", total_amount: "", date: today, transaction_id: "" };

export default function SplitsManager({
  initialSplits,
  recentTransactions,
  prefill,
}: {
  initialSplits: SplitWithParticipants[];
  recentTransactions: Transaction[];
  prefill: Prefill;
}) {
  const supabase = createClient();
  const [splits, setSplits] = useState<SplitWithParticipants[]>(initialSplits);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [form1, setForm1] = useState(emptyForm1);
  const [participants, setParticipants] = useState<LocalParticipant[]>([newParticipant()]);
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [showSettled, setShowSettled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prefill) {
      setForm1({ description: prefill.desc, total_amount: prefill.amount, date: today, transaction_id: prefill.txn_id ?? "" });
      setStep(2);
      setShowModal(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const active = splits.filter((s) => !s.is_settled);
  const settled = splits.filter((s) => s.is_settled);
  const totalOwed = active.reduce(
    (s, split) => s + split.participants.filter((p) => !p.is_paid).reduce((a, p) => a + Number(p.amount), 0),
    0
  );

  function openNew() {
    setForm1(emptyForm1);
    setParticipants([newParticipant()]);
    setSplitMode("equal");
    setStep(1);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setStep(1);
  }

  function applyEqualSplit(parts: LocalParticipant[]): LocalParticipant[] {
    const share = getEqualShare(form1.total_amount, parts.length);
    return parts.map((p) => ({ ...p, amount: share }));
  }

  function addParticipant() {
    const p = newParticipant();
    const next = [...participants, p];
    setParticipants(splitMode === "equal" ? applyEqualSplit(next) : next);
  }

  function removeParticipant(uid: string) {
    const next = participants.filter((p) => p.uid !== uid);
    setParticipants(splitMode === "equal" ? applyEqualSplit(next) : next);
  }

  function updateParticipant(uid: string, field: "name" | "amount", value: string) {
    setParticipants((prev) => prev.map((p) => (p.uid === uid ? { ...p, [field]: value } : p)));
  }

  function switchMode(mode: "equal" | "custom") {
    setSplitMode(mode);
    if (mode === "equal") setParticipants(applyEqualSplit(participants));
  }

  const userShare = getUserShare(form1.total_amount, participants);
  const participantsTotal = participants.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const isCustomValid = Math.abs(participantsTotal - (parseFloat(form1.total_amount) || 0)) < 0.02;

  async function handleCreate() {
    if (!form1.description || !form1.total_amount || participants.some((p) => !p.name)) return;
    if (splitMode === "custom" && !isCustomValid) return;
    setSaving(true);

    const { data: splitData } = await supabase
      .from("splits")
      .insert({
        description: form1.description.trim(),
        total_amount: parseFloat(form1.total_amount),
        date: form1.date,
        transaction_id: form1.transaction_id || null,
        is_settled: false,
      })
      .select()
      .single();

    if (splitData) {
      const { data: partData } = await supabase
        .from("split_participants")
        .insert(participants.map((p) => ({ split_id: splitData.id, name: p.name.trim(), amount: parseFloat(p.amount) })))
        .select();

      setSplits((prev) => [{ ...splitData, participants: partData ?? [] } as SplitWithParticipants, ...prev]);
    }

    setSaving(false);
    closeModal();
  }

  async function handleMarkPaid(participantId: string) {
    await supabase.from("split_participants").update({ is_paid: true }).eq("id", participantId);
    setSplits((prev) =>
      prev.map((s) => ({
        ...s,
        participants: s.participants.map((p) => (p.id === participantId ? { ...p, is_paid: true } : p)),
      }))
    );
  }

  async function handleSettleAll(splitId: string) {
    await supabase.from("splits").update({ is_settled: true }).eq("id", splitId);
    await supabase.from("split_participants").update({ is_paid: true }).eq("split_id", splitId);
    setSplits((prev) =>
      prev.map((s) =>
        s.id === splitId
          ? { ...s, is_settled: true, participants: s.participants.map((p) => ({ ...p, is_paid: true })) }
          : s
      )
    );
  }

  async function handleDelete(splitId: string) {
    if (!window.confirm("Delete this split?")) return;
    await supabase.from("splits").delete().eq("id", splitId);
    setSplits((prev) => prev.filter((s) => s.id !== splitId));
  }

  return (
    <div>
      {/* Summary */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
          <p className="text-xs text-zinc-500">You are owed</p>
          <p className="mt-1 text-2xl font-bold text-cyan-400">${fmtAmt(totalOwed)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
          <p className="text-xs text-zinc-500">You owe</p>
          <p className="mt-1 text-2xl font-bold text-zinc-500">$0.00</p>
        </div>
      </div>

      {/* Active splits */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Active splits ({active.length})
          </h2>
          <button
            onClick={openNew}
            className="rounded-full bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-cyan-400"
          >
            + New split
          </button>
        </div>

        {active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 p-12 text-center">
            <p className="text-2xl mb-2">🤝</p>
            <p className="text-zinc-400 font-medium mb-1">No active splits</p>
            <p className="text-sm text-zinc-500">Split a shared expense and track who owes you</p>
          </div>
        ) : (
          <div className="space-y-4">
            {active.map((s) => (
              <SplitCard key={s.id} split={s} onMarkPaid={handleMarkPaid} onSettleAll={handleSettleAll} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Settled */}
      {settled.length > 0 && (
        <div>
          <button
            onClick={() => setShowSettled((v) => !v)}
            className="mb-4 flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-400"
          >
            <span>Settled ({settled.length})</span>
            <span>{showSettled ? "▲" : "▼"}</span>
          </button>
          {showSettled && (
            <div className="space-y-4">
              {settled.map((s) => (
                <SplitCard key={s.id} split={s} onMarkPaid={handleMarkPaid} onSettleAll={handleSettleAll} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={closeModal}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-50">
                {step === 1 ? "New split — Details" : "New split — Participants"}
              </h2>
              <span className="text-xs text-zinc-500">Step {step}/2</span>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Description</label>
                  <input
                    autoFocus
                    value={form1.description}
                    onChange={(e) => setForm1((f) => ({ ...f, description: e.target.value }))}
                    placeholder="e.g. Dinner at Italian Place"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Total amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form1.total_amount}
                      onChange={(e) => setForm1((f) => ({ ...f, total_amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Date</label>
                    <input
                      type="date"
                      value={form1.date}
                      onChange={(e) => setForm1((f) => ({ ...f, date: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                {recentTransactions.length > 0 && (
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Link to transaction (optional)</label>
                    <select
                      value={form1.transaction_id}
                      onChange={(e) => setForm1((f) => ({ ...f, transaction_id: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
                    >
                      <option value="">None</option>
                      {recentTransactions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.description ?? t.category} — ${Number(t.amount).toFixed(2)} ({t.date})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button onClick={closeModal} className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-400 hover:text-zinc-200">
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!form1.description || !form1.total_amount}
                    className="flex-1 rounded-lg bg-cyan-500 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400 disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                {/* Mode toggle */}
                <div className="mb-4 flex rounded-lg border border-zinc-700 p-0.5">
                  {(["equal", "custom"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => switchMode(m)}
                      className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors capitalize ${splitMode === m ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                      {m === "equal" ? "Split equally" : "Custom amounts"}
                    </button>
                  ))}
                </div>

                {/* Participants */}
                <div className="mb-3 space-y-2">
                  {participants.map((p, i) => (
                    <div key={p.uid} className="flex items-center gap-2">
                      <input
                        value={p.name}
                        onChange={(e) => updateParticipant(p.uid, "name", e.target.value)}
                        placeholder={`Person ${i + 1}`}
                        className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={p.amount}
                        onChange={(e) => splitMode === "custom" && updateParticipant(p.uid, "amount", e.target.value)}
                        readOnly={splitMode === "equal"}
                        className={`w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-right text-sm text-zinc-100 outline-none focus:border-cyan-500 ${splitMode === "equal" ? "cursor-default opacity-60" : ""}`}
                      />
                      <button
                        onClick={() => removeParticipant(p.uid)}
                        disabled={participants.length === 1}
                        className="text-zinc-600 hover:text-red-400 disabled:invisible"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addParticipant}
                  className="mb-4 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  + Add person
                </button>

                {/* Your share */}
                <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-800/40 px-3 py-2 flex justify-between text-sm">
                  <span className="text-zinc-400">Your share</span>
                  <span className="font-semibold text-zinc-200">${fmtAmt(userShare)}</span>
                </div>

                {/* Validation */}
                {splitMode === "custom" && (parseFloat(form1.total_amount) || 0) > 0 && (
                  <p className={`mb-3 text-xs ${isCustomValid ? "text-emerald-400" : "text-amber-400"}`}>
                    {isCustomValid
                      ? "✓ Amounts add up correctly"
                      : `Amounts don't add up — ${participantsTotal.toFixed(2)} of ${parseFloat(form1.total_amount).toFixed(2)}`}
                  </p>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-400 hover:text-zinc-200">
                    ← Back
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={saving || participants.some((p) => !p.name) || (splitMode === "custom" && !isCustomValid)}
                    className="flex-1 rounded-lg bg-cyan-500 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {saving ? "Creating…" : "Create split"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
