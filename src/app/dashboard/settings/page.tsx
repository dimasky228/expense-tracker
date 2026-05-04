"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/src/lib/supabase/client";
import { DEFAULT_PREFS } from "@/src/lib/notifications";
import type { NotificationPref } from "@/src/lib/notifications";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notifPrefs, setNotifPrefs] = useState<NotificationPref>(DEFAULT_PREFS);

  // Get email from Supabase client-side
  const [email, setEmail] = useState<string>("");
  if (typeof window !== "undefined" && !email) {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user?.email) setEmail(data.user.email);
      });
  }

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("notification_prefs") ?? "{}") as Partial<NotificationPref>;
      setNotifPrefs({ ...DEFAULT_PREFS, ...stored });
    } catch {
      // use defaults
    }
  }, []);

  function togglePref(key: keyof NotificationPref) {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("notification_prefs", JSON.stringify(next));
      return next;
    });
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    setDeleting(true);

    const res = await fetch("/api/account/delete", { method: "DELETE" });
    const data = (await res.json()) as { success?: boolean; error?: string };

    if (!res.ok || data.error) {
      setDeleteError(data.error ?? "Something went wrong");
      setDeleting(false);
      return;
    }

    // Sign out and redirect
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          {t("backToDashboard")}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-50">{t("title")}</h1>
      </div>

      {/* Account section */}
      <div className="mb-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          {t("accountSection")}
        </h2>
        <div>
          <p className="text-xs text-zinc-500">{t("yourEmail")}</p>
          <p className="mt-1 text-sm text-zinc-200">{email || "—"}</p>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="mb-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Notifications
        </h2>
        <div className="space-y-4">
          {(
            [
              { key: "budget_alerts" as const, label: "Budget alerts", desc: "Get notified when you're approaching or exceeding a budget" },
              { key: "recurring_reminders" as const, label: "Recurring reminders", desc: "Reminders for upcoming and overdue subscription payments" },
              { key: "goal_updates" as const, label: "Goal updates", desc: "Milestone celebrations and deadline reminders for your goals" },
              { key: "spending_insights" as const, label: "Spending insights", desc: "Alerts for spending spikes and positive savings patterns" },
            ] as { key: keyof NotificationPref; label: string; desc: string }[]
          ).map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-200">{label}</p>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
              <button
                onClick={() => togglePref(key)}
                className={`relative shrink-0 h-6 w-11 rounded-full transition-colors ${notifPrefs[key] ? "bg-cyan-500" : "bg-zinc-700"}`}
                role="switch"
                aria-checked={notifPrefs[key]}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifPrefs[key] ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-600">
          In-app only. Changes take effect on your next dashboard visit.
        </p>
      </div>

      {/* Legal links */}
      <div className="mb-6 flex gap-4 text-xs text-zinc-600">
        <Link href="/privacy" className="hover:text-zinc-400 transition-colors">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-zinc-400 transition-colors">
          Terms of Service
        </Link>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-red-400">
          {t("dangerZone")}
        </h2>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-200">{t("deleteAccount")}</p>
            <p className="mt-1 text-sm text-zinc-500">{t("deleteAccountDesc")}</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="shrink-0 rounded-xl border border-red-500/40 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            {t("deleteAccountButton")}
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold text-zinc-50">{t("deleteModalTitle")}</h3>
            <p className="mt-2 text-sm text-zinc-400">{t("deleteModalDesc")}</p>

            <div className="mt-4">
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={t("deleteModalPlaceholder")}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-50 placeholder-zinc-500 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>

            {deleteError && (
              <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {deleteError}
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText("");
                  setDeleteError("");
                }}
                disabled={deleting}
                className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-50 disabled:opacity-50"
              >
                {t("deleteModalCancel")}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmText !== "DELETE" || deleting}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? t("deleteModalButtonLoading") : t("deleteModalButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
