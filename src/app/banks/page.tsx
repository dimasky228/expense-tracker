import Link from "next/link";
import type { Metadata } from "next";
import { banksByRegion } from "@/src/lib/banks";

export const metadata: Metadata = {
  title: "Supported Banks — Import CSV from Any Bank | ExpenseAI",
  description:
    "Step-by-step guides to export CSV bank statements from Chase, Bank of America, Revolut, Wise, Monzo, HSBC, and 100+ other banks. Import into ExpenseAI for instant AI categorization.",
  keywords: [
    "bank CSV export guide",
    "import bank statement",
    "bank statement CSV",
    "expense tracker banks",
    "supported banks expense tracker",
  ],
};

export default function BanksPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-zinc-50">
            Expense<span className="text-cyan-400">AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-50">
              Sign in
            </Link>
            <Link href="/signup" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300">
              Get started free
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        {/* Hero */}
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan-400">
            CSV Import Guides
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            Works with statements from 100+ banks
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
            If your bank exports CSV, ExpenseAI works with it. Find your bank below for
            a step-by-step export guide — no bank login or connection required.
          </p>
        </div>

        {/* Bank groups */}
        <div className="space-y-14">
          {Object.entries(banksByRegion).map(([region, regionBanks]) => (
            <section key={region} aria-labelledby={`region-${region}`}>
              <div className="mb-6 flex items-center gap-4">
                <h2
                  id={`region-${region}`}
                  className="text-sm font-semibold uppercase tracking-wider text-zinc-500"
                >
                  {region}
                </h2>
                <div className="h-px flex-1 bg-zinc-800/60" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regionBanks.map((bank) => (
                  <Link
                    key={bank.slug}
                    href={`/banks/${bank.slug}`}
                    className="group flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-600 hover:bg-zinc-900"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" aria-hidden="true">{bank.flag}</span>
                      <div>
                        <p className="font-semibold text-zinc-100 group-hover:text-zinc-50">
                          {bank.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {bank.steps.length} steps · CSV guide
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-zinc-600 transition-colors group-hover:text-cyan-400">
                      View guide →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Not listed CTA */}
        <section
          aria-labelledby="other-banks-heading"
          className="mt-16 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-8 text-center"
        >
          <h2 id="other-banks-heading" className="mb-3 text-xl font-bold text-zinc-50">
            Don&apos;t see your bank?
          </h2>
          <p className="mb-6 text-zinc-400">
            ExpenseAI works with any bank that exports CSV statements — not just the ones listed here.
            If your bank has a download or export option, try uploading it directly.
            Our parser handles dozens of CSV formats automatically.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300"
          >
            Try importing your CSV — it&apos;s free
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-800/50 bg-zinc-950 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="text-base font-bold text-zinc-50">
            Expense<span className="text-cyan-400">AI</span>
          </Link>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Back to home
          </Link>
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} ExpenseAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
