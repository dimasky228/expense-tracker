"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/src/lib/supabase/client";
import LanguageSwitcher from "@/src/components/LanguageSwitcher";
import NotificationBell from "@/src/components/NotificationBell";

type Props = {
  email: string;
  isPro: boolean;
  hasStripeCustomer: boolean;
};

export default function DashboardNavbar({ email, isPro, hasStripeCustomer }: Props) {
  const t = useTranslations("common");
  const tDash = useTranslations("dashboard");
  const tOnboarding = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();
  const [showSetupLink, setShowSetupLink] = useState(false);

  useEffect(() => {
    setShowSetupLink(localStorage.getItem("onboarding_completed") !== "true");
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleManage() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) window.location.href = data.url;
  }

  async function handleUpgrade() {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = (await res.json()) as { url?: string };
    if (data.url) window.location.href = data.url;
  }

  return (
    <header className="border-b border-zinc-800/50 bg-zinc-950">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-zinc-50">
            Expense<span className="text-cyan-400">AI</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/budgets"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
            >
              Budgets
            </Link>
            <Link
              href="/dashboard/recurring"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
            >
              Recurring
            </Link>
            <Link
              href="/dashboard/goals"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
            >
              Goals
            </Link>
            <Link
              href="/dashboard/splits"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
            >
              Splits
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {showSetupLink && (
            <Link
              href="/dashboard/onboarding"
              className="hidden rounded-full border border-cyan-400/30 bg-cyan-400/5 px-3 py-1 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-400/10 sm:block"
            >
              {tOnboarding("completeSetup")}
            </Link>
          )}
          <LanguageSwitcher locale={locale} />
          <NotificationBell />
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-zinc-400">{email}</span>
            {isPro ? (
              <>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs font-semibold text-cyan-400">
                  {t("pro")}
                </span>
                {hasStripeCustomer && (
                  <button
                    onClick={handleManage}
                    className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                  >
                    {tDash("manageSubscription")}
                  </button>
                )}
              </>
            ) : (
              <>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-400">
                  {t("free")}
                </span>
                <button
                  onClick={handleUpgrade}
                  className="text-xs font-medium text-cyan-400 underline-offset-2 hover:underline"
                >
                  {t("upgrade")}
                </button>
              </>
            )}
          </div>
          <Link
            href="/dashboard/settings"
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-50"
          >
            {t("signOut")}
          </button>
        </div>
      </nav>
    </header>
  );
}
