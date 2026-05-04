"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { NOTIFICATION_ICONS, NOTIFICATION_COLORS } from "@/src/lib/notifications";
import type { AppNotification } from "@/src/lib/notifications";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications?limit=5");
      if (res.ok) {
        const data = (await res.json()) as AppNotification[];
        setNotifications(data);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchNotifications();
    window.addEventListener("notificationsRefresh", fetchNotifications);
    return () => window.removeEventListener("notificationsRefresh", fetchNotifications);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <span className="text-sm font-semibold text-zinc-200">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={async () => {
                  setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                  await fetch("/api/notifications", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ all: true }),
                  });
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl mb-1">🔔</p>
              <p className="text-sm text-zinc-500">No notifications yet</p>
            </div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`cursor-pointer border-b border-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800/50 last:border-0 ${!n.is_read ? "bg-zinc-800/30" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-base shrink-0">{NOTIFICATION_ICONS[n.type as keyof typeof NOTIFICATION_ICONS] ?? "🔔"}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold leading-tight ${NOTIFICATION_COLORS[n.type as keyof typeof NOTIFICATION_COLORS] ?? "text-zinc-300"}`}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400 line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[10px] text-zinc-600">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-zinc-800 px-4 py-2.5 text-center">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              See all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
