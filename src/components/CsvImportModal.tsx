"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import CsvReviewTable from "@/src/components/CsvReviewTable";
import type { CategorizedTransaction } from "@/src/types/transaction";

type Step = "idle" | "loading" | "review" | "saving" | "done";

export default function CsvImportModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [transactions, setTransactions] = useState<CategorizedTransaction[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function reset() {
    setStep("idle");
    setFile(null);
    setError("");
    setSaveError("");
    setTransactions([]);
    setDragOver(false);
  }

  function handleClose() {
    if (step === "loading" || step === "saving") return;
    setOpen(false);
    setTimeout(reset, 200);
  }

  function acceptFile(f: File) {
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a .csv file");
      return;
    }
    setError("");
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setStep("loading");
    setError("");

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/import", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Import failed");
        setStep("idle");
        return;
      }
      setTransactions(json.transactions as CategorizedTransaction[]);
      setStep("review");
    } catch {
      setError("Network error — please try again.");
      setStep("idle");
    }
  }

  async function handleSave(reviewed: CategorizedTransaction[]) {
    setStep("saving");
    setSaveError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaveError("Not authenticated");
      setStep("review");
      return;
    }

    const rows = reviewed.map((t) => ({
      user_id: user.id,
      amount: t.amount,
      type: t.type,
      category: t.category,
      description: t.description,
      date: t.date,
    }));

    const { error } = await supabase.from("transactions").insert(rows);
    if (error) {
      setSaveError(error.message);
      setStep("review");
      return;
    }

    setStep("done");
    setTimeout(() => {
      setOpen(false);
      setTimeout(reset, 200);
      router.refresh();
    }, 1800);
  }

  const wide = step === "review" || step === "saving";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50"
      >
        Import CSV
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={handleClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full rounded-t-2xl border border-zinc-700/50 bg-zinc-900 p-6 sm:rounded-2xl ${
              wide ? "max-w-4xl" : "max-w-md"
            }`}
          >
            {/* ── Idle / Loading ── */}
            {(step === "idle" || step === "loading") && (
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-zinc-50">
                    Import CSV
                  </h2>
                  <button
                    onClick={handleClose}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => !file && fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                    dragOver
                      ? "border-cyan-400 bg-cyan-400/5"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-8 w-8 text-zinc-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="mt-3 text-sm text-zinc-400">
                    Drag & drop your CSV, or{" "}
                    <span className="text-cyan-400">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Export a CSV statement from your bank and drop it here
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptFile(f); }}
                  />
                </div>

                {/* Selected file */}
                {file && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 shrink-0 text-cyan-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-200">{file.name}</p>
                      <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => setFile(null)} className="shrink-0 text-zinc-500 hover:text-zinc-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {error && (
                  <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </p>
                )}

                {step === "loading" ? (
                  <div className="mt-4 flex items-center justify-center gap-3 rounded-xl bg-zinc-800/50 py-4">
                    <svg className="h-5 w-5 animate-spin text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm text-zinc-300">
                      AI is categorizing your transactions…
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleUpload}
                    disabled={!file}
                    className="mt-4 w-full rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Upload & categorize
                  </button>
                )}
              </div>
            )}

            {/* ── Review / Saving ── */}
            {(step === "review" || step === "saving") && (
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-zinc-50">
                    Review import
                  </h2>
                  <button
                    onClick={handleClose}
                    disabled={step === "saving"}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <CsvReviewTable
                  transactions={transactions}
                  saving={step === "saving"}
                  saveError={saveError}
                  onSave={handleSave}
                  onCancel={handleClose}
                />
              </div>
            )}

            {/* ── Done ── */}
            {step === "done" && (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-7 w-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-zinc-50">
                  Imported!
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {transactions.length} transactions added to your dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
