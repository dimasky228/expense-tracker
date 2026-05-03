"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { BudgetStatus } from "@/src/lib/budgets";

function getDismissKey(month: string) {
  return `budget_dismissed_${month}`;
}

function loadDismissed(month: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(getDismissKey(month));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveDismissed(month: string, categories: Set<string>) {
  localStorage.setItem(getDismissKey(month), JSON.stringify([...categories]));
}

export default function BudgetAlerts({
  statuses,
  month,
}: {
  statuses: BudgetStatus[];
  month: string; // YYYY-MM for localStorage keying
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDismissed(loadDismissed(month));
    setMounted(true);
  }, [month]);

  function dismiss(category: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(category);
      saveDismissed(month, next);
      return next;
    });
  }

  if (!mounted) return null;

  const alerts = statuses.filter((s) => {
    if (dismissed.has(s.category)) return false;
    return s.percentage >= 80;
  });

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {alerts.map((s) => {
        const isOver = s.status === "over";
        return (
          <div
            key={s.category}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
              isOver
                ? "border-red-500/30 bg-red-500/10"
                : "border-amber-400/30 bg-amber-400/10"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`mt-0.5 h-4 w-4 shrink-0 ${isOver ? "text-red-400" : "text-amber-400"}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <p className={`flex-1 text-sm ${isOver ? "text-red-300" : "text-amber-300"}`}>
              {isOver ? (
                <>
                  <span className="font-semibold">Over budget:</span>{" "}
                  {s.category} exceeded your ${s.budget.toFixed(0)} limit by ${(s.spent - s.budget).toFixed(0)}.
                </>
              ) : (
                <>
                  <span className="font-semibold">Heads up:</span>{" "}
                  {s.category} is at {s.percentage.toFixed(0)}% of your ${s.budget.toFixed(0)} budget.
                </>
              )}
              {" "}
              <Link href="/dashboard/budgets" className="underline underline-offset-2 opacity-70 hover:opacity-100">
                View budgets →
              </Link>
            </p>
            <button
              onClick={() => dismiss(s.category)}
              className="shrink-0 text-zinc-500 hover:text-zinc-300"
              aria-label="Dismiss"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
