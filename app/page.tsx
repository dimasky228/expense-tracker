import Link from "next/link";

const banks = [
  "Chase",
  "Bank of America",
  "Wells Fargo",
  "Revolut",
  "Wise",
  "Citibank",
  "HSBC",
  "Barclays",
  "N26",
  "Monzo",
];

const features = [
  {
    title: "AI categorization",
    description: "Drop in a CSV. Get every transaction sorted in seconds.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        />
      </svg>
    ),
  },
  {
    title: "Weekly insights",
    description:
      "Find patterns, unused subscriptions, and spending anomalies automatically.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
      </svg>
    ),
  },
  {
    title: "Privacy-first",
    description:
      "Your data never touches your bank. CSV in, insights out. Nothing stored.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
        />
      </svg>
    ),
  },
];

const steps = [
  {
    number: "01",
    title: "Upload statement",
    description:
      "Export a CSV from your bank app or online portal. Most banks have this under Account Activity or Statements.",
  },
  {
    number: "02",
    title: "AI categorizes",
    description:
      "Every row gets a category, merchant tag, and anomaly flag. Recurring charges are detected automatically. Takes under 10 seconds.",
  },
  {
    number: "03",
    title: "Get insights",
    description:
      "See your spending breakdown, month-over-month trends, and a digest of subscriptions you may have forgotten about.",
  },
];

const faqs = [
  {
    q: "Is my financial data secure?",
    a: "Your CSV is processed in memory and never stored on our servers. We don't have access to your bank or account numbers — only the transaction rows you explicitly upload.",
  },
  {
    q: "Which banks are supported?",
    a: "Any bank that exports CSV statements. We've tested with Chase, Bank of America, Wells Fargo, Revolut, Wise, Monzo, N26, HSBC, Barclays, and dozens more. If your bank exports CSV, it works.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings with one click. No dark patterns, no retention flows. Your data stays accessible for 30 days after cancellation.",
  },
  {
    q: "Can I export my data?",
    a: "Yes — export your categorized transactions and insights as CSV or PDF at any time. The Pro plan includes automated monthly PDF reports.",
  },
  {
    q: "Does it work with crypto transactions?",
    a: "Partially. We support CSV exports from Coinbase, Kraken, and Binance. DeFi and on-chain transaction history isn't supported yet — it's on the roadmap.",
  },
];

const mockTransactions = [
  {
    name: "Netflix",
    category: "Entertainment",
    amount: "-$15.99",
    recurring: true,
    positive: false,
  },
  {
    name: "Whole Foods",
    category: "Groceries",
    amount: "-$84.20",
    recurring: false,
    positive: false,
  },
  {
    name: "Venmo from Alex",
    category: "Transfer",
    amount: "+$120.00",
    recurring: false,
    positive: true,
  },
  {
    name: "Spotify",
    category: "Entertainment",
    amount: "-$9.99",
    recurring: true,
    positive: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-md">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"
          aria-label="Main navigation"
        >
          <Link href="/" className="text-xl font-bold tracking-tight text-zinc-50">
            Expense<span className="text-cyan-400">AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Sign in
            </a>
            <a
              href="#"
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Get started
            </a>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ── */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden px-6 pb-24 pt-20 md:pb-32 md:pt-28"
        >
          {/* Radial glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(34,211,238,0.07),transparent)]"
          />

          <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-16 lg:flex-row lg:items-center lg:gap-12">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan-400">
                AI-powered expense tracking
              </p>
              <h1
                id="hero-heading"
                className="text-4xl font-bold leading-[1.1] tracking-tight text-zinc-50 sm:text-5xl md:text-[3.5rem]"
              >
                The expense tracker that actually{" "}
                <span className="text-cyan-400">understands</span> your spending
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
                Upload your bank statement. Get instant AI categorization,
                weekly insights, and catch unused subscriptions. No bank account
                connection required.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                <a
                  href="#"
                  className="w-full rounded-xl bg-cyan-400 px-8 py-3.5 text-center text-base font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
                >
                  Start tracking free
                </a>
                <a
                  href="#how-it-works"
                  className="text-base font-medium text-zinc-400 transition-colors hover:text-zinc-50"
                >
                  See how it works →
                </a>
              </div>
            </div>

            {/* Mock UI card */}
            <div className="flex flex-1 justify-center lg:justify-end">
              <div className="animate-float w-full max-w-sm rounded-2xl border border-zinc-700/50 bg-zinc-900 p-5 shadow-2xl shadow-black/60">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Recent transactions
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-zinc-300">
                      March 2024 · 47 rows
                    </p>
                  </div>
                  <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-400">
                    AI sorted
                  </span>
                </div>

                <div className="space-y-3.5">
                  {mockTransactions.map((t) => (
                    <div
                      key={t.name}
                      className="flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {t.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-zinc-500">
                            {t.category}
                          </span>
                          {t.recurring && (
                            <span className="rounded-full bg-amber-400/10 px-1.5 py-px text-[10px] font-semibold text-amber-400">
                              recurring
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-semibold tabular-nums ${
                          t.positive ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {t.amount}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-cyan-400/5 px-3 py-2.5">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                  <p className="text-xs font-medium text-cyan-400">
                    2 recurring subscriptions detected
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Social proof strip ── */}
        <section
          aria-label="Supported banks"
          className="border-y border-zinc-800/50 bg-zinc-900/30 px-6 py-7"
        >
          <div className="mx-auto max-w-6xl">
            <p className="mb-4 text-center text-sm text-zinc-500">
              Works with statements from
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {banks.map((bank) => (
                <span
                  key={bank}
                  className="rounded-full border border-zinc-700/50 bg-zinc-800/50 px-3 py-1 text-xs font-medium text-zinc-400"
                >
                  {bank}
                </span>
              ))}
              <span className="rounded-full border border-zinc-700/50 bg-zinc-800/50 px-3 py-1 text-xs font-medium text-zinc-400">
                +100 more
              </span>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section
          aria-labelledby="features-heading"
          className="px-6 py-24 md:py-32"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2
                id="features-heading"
                className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl"
              >
                Built for people who care about their money
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                Not another budgeting app with a dashboard you&apos;ll check
                once.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-7 transition-colors hover:border-zinc-700/60"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                    {f.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-zinc-50">
                    {f.title}
                  </h3>
                  <p className="leading-relaxed text-zinc-400">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section
          id="how-it-works"
          aria-labelledby="how-heading"
          className="scroll-mt-20 border-t border-zinc-800/50 bg-zinc-900/20 px-6 py-24 md:py-32"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2
                id="how-heading"
                className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl"
              >
                Three steps, no drama
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                From raw bank export to actionable insights in under a minute.
              </p>
            </div>
            <div className="grid gap-10 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col items-start">
                  <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm font-bold text-cyan-400">
                    {step.number}
                  </span>
                  <h3 className="mb-2 text-xl font-semibold text-zinc-50">
                    {step.title}
                  </h3>
                  <p className="leading-relaxed text-zinc-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section
          aria-labelledby="pricing-heading"
          className="border-t border-zinc-800/50 px-6 py-24 md:py-32"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2
                id="pricing-heading"
                className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl"
              >
                Simple pricing
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                Start free. Upgrade when you need more.
              </p>
            </div>
            <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
              {/* Free */}
              <div className="flex flex-col rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-8">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Free
                </p>
                <div className="mb-1 flex items-end gap-1">
                  <span className="text-5xl font-bold text-zinc-50">$0</span>
                </div>
                <p className="mb-8 text-sm text-zinc-500">forever</p>
                <ul className="mb-8 flex-1 space-y-3 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400" aria-hidden="true">
                      ✓
                    </span>
                    3 CSV uploads per month
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400" aria-hidden="true">
                      ✓
                    </span>
                    Basic AI categorization
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400" aria-hidden="true">
                      ✓
                    </span>
                    Spending breakdown
                  </li>
                  <li className="flex items-center gap-2 text-zinc-600">
                    <span aria-hidden="true">✗</span> Weekly AI insights
                  </li>
                  <li className="flex items-center gap-2 text-zinc-600">
                    <span aria-hidden="true">✗</span> Subscription finder
                  </li>
                  <li className="flex items-center gap-2 text-zinc-600">
                    <span aria-hidden="true">✗</span> PDF reports
                  </li>
                </ul>
                <a
                  href="#"
                  className="block w-full rounded-xl border border-zinc-700 px-6 py-3 text-center text-sm font-semibold text-zinc-50 transition-colors hover:border-zinc-500 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  Get started free
                </a>
              </div>

              {/* Pro */}
              <div className="relative flex flex-col rounded-2xl border border-cyan-400/30 bg-zinc-900/50 p-8">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold text-zinc-950">
                    Most popular
                  </span>
                </div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-400">
                  Pro
                </p>
                <div className="mb-1 flex items-end gap-1">
                  <span className="text-5xl font-bold text-zinc-50">$6.99</span>
                  <span className="mb-1.5 text-zinc-400">/mo</span>
                </div>
                <p className="mb-8 text-sm text-zinc-500">
                  billed monthly, cancel anytime
                </p>
                <ul className="mb-8 flex-1 space-y-3 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400" aria-hidden="true">
                      ✓
                    </span>
                    Unlimited CSV uploads
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400" aria-hidden="true">
                      ✓
                    </span>
                    Advanced AI categorization
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400" aria-hidden="true">
                      ✓
                    </span>
                    Weekly AI insights
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400" aria-hidden="true">
                      ✓
                    </span>
                    Subscription finder
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400" aria-hidden="true">
                      ✓
                    </span>
                    PDF reports
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400" aria-hidden="true">
                      ✓
                    </span>
                    Priority support
                  </li>
                </ul>
                <a
                  href="#"
                  className="block w-full rounded-xl bg-cyan-400 px-6 py-3 text-center text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  Start Pro free trial
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section
          aria-labelledby="faq-heading"
          className="border-t border-zinc-800/50 bg-zinc-900/20 px-6 py-24 md:py-32"
        >
          <div className="mx-auto max-w-3xl">
            <h2
              id="faq-heading"
              className="mb-12 text-center text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl"
            >
              Frequently asked questions
            </h2>
            <div className="space-y-2">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="rounded-xl border border-zinc-800/60 bg-zinc-900/50"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-base font-medium text-zinc-50 transition-colors hover:text-cyan-400">
                    {faq.q}
                    <span className="faq-icon text-zinc-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </summary>
                  <div className="faq-body px-6 pb-5 text-zinc-400 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800/50 bg-zinc-950 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="text-base font-bold text-zinc-50">
            Expense<span className="text-cyan-400">AI</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="#" className="transition-colors hover:text-zinc-300">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-zinc-300">
              Terms
            </a>
          </div>
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} ExpenseAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
