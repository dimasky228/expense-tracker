"use client";

import { useState, useEffect, useCallback } from "react";
import type { Insight } from "@/src/types/insights";
import {
  getCachedInsights,
  setCachedInsights,
  getCacheTimestamp,
} from "@/src/lib/insights-cache";
import InsightCard from "@/src/components/InsightCard";

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex gap-3">
        <div className="mt-0.5 h-5 w-5 shrink-0 rounded bg-zinc-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-zinc-800" />
          <div className="h-3 w-full rounded bg-zinc-700/60" />
          <div className="h-3 w-5/6 rounded bg-zinc-700/60" />
        </div>
      </div>
    </div>
  );
}

type Status = "checking" | "fetching" | "loaded" | "error" | "insufficient";

export default function InsightsPanel({
  totalTransactions,
}: {
  totalTransactions: number;
}) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [status, setStatus] = useState<Status>("checking");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const loadInsights = useCallback(async (force: boolean) => {
    if (!force) {
      const cached = getCachedInsights();
      if (cached) {
        setInsights(cached.insights);
        setLastFetched(cached.timestamp);
        setStatus("loaded");
        return;
      }
    }

    setStatus("fetching");
    setErrorMsg("");

    try {
      const res = await fetch("/api/insights");
      const data = (await res.json()) as { insights?: Insight[]; error?: string };

      if (!res.ok) {
        setErrorMsg(data.error ?? "Failed to generate insights");
        setStatus("error");
        return;
      }

      const list = data.insights ?? [];
      const now = Date.now();
      setInsights(list);
      setLastFetched(now);
      setCachedInsights(list);
      setStatus("loaded");
    } catch {
      setErrorMsg("Network error — please try again.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (totalTransactions < 10) {
      setStatus("insufficient");
      return;
    }
    // Sync timestamp from cache first (for "last analyzed" display)
    const ts = getCacheTimestamp();
    if (ts) setLastFetched(ts);

    loadInsights(false);
  }, [totalTransactions, loadInsights]);

  const isLoading = status === "checking" || status === "fetching";

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          AI Insights
        </h2>
        {status === "loaded" && (
          <button
            onClick={() => loadInsights(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-3.5 w-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Refresh
          </button>
        )}
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Insufficient data */}
      {status === "insufficient" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-zinc-300">Not enough data yet</p>
          <p className="mt-2 text-sm text-zinc-500">
            Add at least 10 transactions to unlock AI insights. We need enough data
            to find meaningful patterns.
          </p>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-6 text-center">
          <p className="text-sm font-semibold text-red-400">Insights unavailable</p>
          <p className="mt-1 text-sm text-zinc-500">{errorMsg}</p>
          <button
            onClick={() => loadInsights(true)}
            className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
          >
            Try again
          </button>
        </div>
      )}

      {/* Insights */}
      {status === "loaded" && (
        <>
          <div className="space-y-3">
            {insights.slice(0, 6).map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
          {lastFetched && (
            <p className="mt-3 text-right text-xs text-zinc-600">
              Last analyzed: {timeAgo(lastFetched)}
            </p>
          )}
        </>
      )}
    </div>
  );
}
