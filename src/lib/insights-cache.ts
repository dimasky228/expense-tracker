import type { Insight } from "@/src/types/insights";

const CACHE_KEY = "expenseai_insights";
const STALE_KEY = "expenseai_insights_stale";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

type CachedInsights = {
  insights: Insight[];
  timestamp: number;
};

export function getCachedInsights(): CachedInsights | null {
  try {
    if (localStorage.getItem(STALE_KEY)) return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedInsights;
    if (Date.now() - parsed.timestamp > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setCachedInsights(insights: Insight[]) {
  try {
    localStorage.removeItem(STALE_KEY);
    localStorage.setItem(CACHE_KEY, JSON.stringify({ insights, timestamp: Date.now() }));
  } catch {}
}

export function markInsightsStale() {
  try {
    localStorage.setItem(STALE_KEY, "1");
  } catch {}
}

export function getCacheTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as CachedInsights).timestamp;
  } catch {
    return null;
  }
}
