"use client";

import { useState } from "react";
import UpgradeButton from "@/src/components/UpgradeButton";

export default function ExportPdfButton({ month, isPro }: { month: string; isPro: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isPro) {
    return <UpgradeButton variant="locked" />;
  }

  async function handleExport() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/export/pdf?month=${month}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError((json as { error?: string }).error ?? "Export failed");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenseai-${month}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating…
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export PDF
          </>
        )}
      </button>
      {error && (
        <p className="absolute right-0 top-full mt-1 whitespace-nowrap text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
