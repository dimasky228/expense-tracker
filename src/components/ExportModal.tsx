"use client";

import { useState } from "react";

type Range = "month" | "3months" | "6months" | "all" | "custom";

function buildParams(range: Range, month: string, from: string, to: string): string {
  const now = new Date();
  switch (range) {
    case "month":
      return `month=${month}`;
    case "3months": {
      const f = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split("T")[0]!;
      const t = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]!;
      return `from=${f}&to=${t}`;
    }
    case "6months": {
      const f = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split("T")[0]!;
      const t = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]!;
      return `from=${f}&to=${t}`;
    }
    case "all":
      return "";
    case "custom":
      return from && to ? `from=${from}&to=${to}` : "";
  }
}

async function triggerDownload(url: string, filename: string): Promise<string | null> {
  const res = await fetch(url);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return (json as { error?: string }).error ?? "Export failed";
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  return null;
}

const RANGE_LABELS: Record<Range, string> = {
  month: "This month",
  "3months": "Last 3 months",
  "6months": "Last 6 months",
  all: "All time",
  custom: "Custom",
};

export default function ExportModal({ month, isPro }: { month: string; isPro: boolean }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<Range>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    setError("");
  }

  const params = buildParams(range, month, customFrom, customTo);
  const rangeReady = range !== "custom" || (!!customFrom && !!customTo);

  async function handleCSV() {
    setLoading("csv");
    setError("");
    const err = await triggerDownload(`/api/export/csv?${params}`, `ExpenseAI-export.csv`);
    if (err) setError(err);
    setLoading(null);
  }

  async function handleXLSX() {
    setLoading("xlsx");
    setError("");
    const err = await triggerDownload(`/api/export/xlsx?${params}`, `ExpenseAI-export.xlsx`);
    if (err) setError(err);
    setLoading(null);
  }

  async function handlePDF() {
    setLoading("pdf");
    setError("");
    const err = await triggerDownload(`/api/export/pdf?month=${month}`, `expenseai-${month}.pdf`);
    if (err) setError(err);
    setLoading(null);
  }

  async function handleCopyTSV() {
    setLoading("tsv");
    setError("");
    try {
      const res = await fetch(`/api/export/csv?${params}&format=tsv`);
      if (!res.ok) { setError("Failed to fetch data"); return; }
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch {
      setError("Clipboard access denied. Try downloading CSV instead.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Export
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-50">Export transactions</h2>
              <button onClick={close} className="text-zinc-500 hover:text-zinc-300">✕</button>
            </div>

            {/* Date range */}
            <div className="mb-5">
              <p className="mb-2 text-xs font-medium text-zinc-400">Date range</p>
              <div className="flex flex-wrap gap-1.5">
                {(["month", "3months", "6months", "all", "custom"] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      range === r
                        ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/50"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {RANGE_LABELS[r]}
                  </button>
                ))}
              </div>
              {range === "custom" && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">From</label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">To</label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Export options */}
            <div className="space-y-2">
              {/* CSV */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-200">CSV</p>
                  <p className="text-xs text-zinc-500">All transactions as comma-separated file</p>
                </div>
                <button
                  onClick={handleCSV}
                  disabled={!rangeReady || loading === "csv"}
                  className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
                >
                  {loading === "csv" ? "…" : "Download"}
                </button>
              </div>

              {/* Excel */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/40 px-4 py-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    Excel
                    {!isPro && (
                      <span className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">PRO</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">Formatted .xlsx with summary sheet</p>
                </div>
                {isPro ? (
                  <button
                    onClick={handleXLSX}
                    disabled={!rangeReady || loading === "xlsx"}
                    className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
                  >
                    {loading === "xlsx" ? "…" : "Download"}
                  </button>
                ) : (
                  <a
                    href="/dashboard/settings"
                    onClick={close}
                    className="rounded-lg bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/25"
                  >
                    Upgrade
                  </a>
                )}
              </div>

              {/* PDF */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/40 px-4 py-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    PDF Report
                    {!isPro && (
                      <span className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">PRO</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">Monthly report for {month}</p>
                </div>
                {isPro ? (
                  <button
                    onClick={handlePDF}
                    disabled={loading === "pdf"}
                    className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
                  >
                    {loading === "pdf" ? "…" : "Download"}
                  </button>
                ) : (
                  <a
                    href="/dashboard/settings"
                    onClick={close}
                    className="rounded-lg bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/25"
                  >
                    Upgrade
                  </a>
                )}
              </div>

              {/* Google Sheets */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-200">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-emerald-400" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zm-1.5 15H6V6h12v12zm-9-9h6v1.5H9V9zm0 3h6v1.5H9V12zm0 3h4.5v1.5H9V15z"/>
                      </svg>
                      Google Sheets
                    </p>
                    <p className="text-xs text-zinc-500">Copy data, paste into a new Google Sheet</p>
                  </div>
                  <button
                    onClick={handleCopyTSV}
                    disabled={!rangeReady || !!loading}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      copied
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
                    }`}
                  >
                    {loading === "tsv" ? "…" : copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                {copied && (
                  <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                    <p className="font-medium mb-1">Copied to clipboard!</p>
                    <p className="text-emerald-400/80">Open Google Sheets, click cell A1, and press Ctrl+V (Cmd+V on Mac).</p>
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-emerald-200"
                    >
                      Open Google Sheets →
                    </a>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-400">{error}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
