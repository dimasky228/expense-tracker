"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export default function DashboardNavbar({ email }: { email: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-zinc-800/50 bg-zinc-950">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-zinc-50">
          Expense<span className="text-cyan-400">AI</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-zinc-400 sm:block">{email}</span>
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
