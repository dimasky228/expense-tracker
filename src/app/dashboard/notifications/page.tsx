"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { groupByDate, NOTIFICATION_ICONS, NOTIFICATION_COLORS } from "@/src/lib/notifications";
import type { AppNotification } from "@/src/lib/notifications";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications?limit=100")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data as AppNotification[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const groups = groupByDate(notifications);

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Dashboard
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">Notifications</h1>
            {unreadCount > 0 && (
              <p className="mt-1 text-sm text-zinc-400">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-800/50" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 p-16 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-zinc-300 font-medium mb-1">No notifications yet</p>
          <p className="text-sm text-zinc-500">
            We'll notify you about budget alerts, upcoming payments, and goal progress.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
              <div className="overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/50">
                {items.map((n, idx) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                      !n.is_read ? "cursor-pointer bg-zinc-800/30 hover:bg-zinc-800/50" : ""
                    } ${idx < items.length - 1 ? "border-b border-zinc-800/60" : ""}`}
                  >
                    <span className="mt-0.5 text-xl shrink-0">
                      {NOTIFICATION_ICONS[n.type as keyof typeof NOTIFICATION_ICONS] ?? "🔔"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold leading-tight ${NOTIFICATION_COLORS[n.type as keyof typeof NOTIFICATION_COLORS] ?? "text-zinc-300"}`}>
                          {n.title}
                        </p>
                        <span className="shrink-0 text-xs text-zinc-600">{timeAgo(n.created_at)}</span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">{n.message}</p>
                    </div>
                    {!n.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
