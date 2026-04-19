"use client";

import { useState } from "react";

type Variant = "banner" | "inline" | "locked";

export default function UpgradeButton({ variant = "inline" }: { variant?: Variant }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  if (variant === "banner") {
    return (
      <div className="mb-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              Unlock AI Insights & unlimited imports
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Free plan includes 3 CSV imports/month. Upgrade to Pro for AI insights, PDF exports, and unlimited imports.
            </p>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="shrink-0 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 disabled:opacity-60"
          >
            {loading ? "Redirecting…" : "Upgrade to Pro — $6.99/mo"}
          </button>
        </div>
      </div>
    );
  }

  if (variant === "locked") {
    return (
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl border border-cyan-400/40 px-5 py-2.5 text-sm font-semibold text-cyan-400 transition-colors hover:border-cyan-400 hover:bg-cyan-400/5 disabled:opacity-60"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        {loading ? "Redirecting…" : "Pro feature — Upgrade"}
      </button>
    );
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 disabled:opacity-60"
    >
      {loading ? "Redirecting…" : "Upgrade to Pro"}
    </button>
  );
}
