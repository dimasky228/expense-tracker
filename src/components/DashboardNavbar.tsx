"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

type Props = {
  email: string;
  isPro: boolean;
  hasStripeCustomer: boolean;
};

export default function DashboardNavbar({ email, isPro, hasStripeCustomer }: Props) {
  const router = useRouter();

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
        <Link href="/" className="text-xl font-bold text-zinc-50">
          Expense<span className="text-cyan-400">AI</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-zinc-400">{email}</span>
            {isPro ? (
              <>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs font-semibold text-cyan-400">
                  Pro
                </span>
                {hasStripeCustomer && (
                  <button
                    onClick={handleManage}
                    className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                  >
                    Manage
                  </button>
                )}
              </>
            ) : (
              <>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-400">
                  Free
                </span>
                <button
                  onClick={handleUpgrade}
                  className="text-xs font-medium text-cyan-400 underline-offset-2 hover:underline"
                >
                  Upgrade
                </button>
              </>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-50"
          >
            Sign out
          </button>
        </div>
      </nav>
    </header>
  );
}
