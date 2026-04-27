import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { banks, getBankBySlug } from "@/src/lib/banks";

export function generateStaticParams() {
  return banks.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const bank = getBankBySlug(slug);
  if (!bank) return {};

  return {
    title: `How to Import ${bank.name} Transactions — ExpenseAI`,
    description: `Step-by-step guide to export your ${bank.name} statement as CSV and import it into ExpenseAI for AI-powered categorization and spending insights.`,
    keywords: [
      `${bank.name} CSV export`,
      `import ${bank.name} transactions`,
      `${bank.name} bank statement CSV`,
      `${bank.name} expense tracker`,
      `${bank.name} budget app`,
    ],
    openGraph: {
      title: `Import ${bank.name} Transactions into ExpenseAI`,
      description: `Export your ${bank.name} statement and get instant AI categorization.`,
    },
  };
}

function HowToJsonLd({ bank }: { bank: ReturnType<typeof getBankBySlug> }) {
  if (!bank) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Import ${bank.name} Transactions into ExpenseAI`,
    description: `Step-by-step guide to export your ${bank.name} CSV statement and import it into ExpenseAI.`,
    step: bank.steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function BankPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bank = getBankBySlug(slug);
  if (!bank) notFound();

  const relatedBanks = banks
    .filter((b) => b.slug !== bank.slug && b.country === bank.country)
    .slice(0, 4);

  const faqs = [
    {
      q: `Is it safe to upload my ${bank.name} statement?`,
      a: `Yes. Your CSV file contains only transaction rows — no account passwords, PINs, or credentials. ExpenseAI processes the file in memory and never stores raw transaction data on our servers. The data is used only to generate your categorized view and insights.`,
    },
    {
      q: `What date range can I export from ${bank.name}?`,
      a: `${bank.name} supports exports of ${bank.dateRange}. For best results, we recommend exporting 3–6 months at a time. ExpenseAI handles large files, but smaller date ranges keep imports fast.`,
    },
    {
      q: `Does ExpenseAI work with ${bank.name} credit cards too?`,
      a: `Yes — ExpenseAI works with both checking/debit and credit card statements from ${bank.name}. Export each account separately and import them one at a time. ExpenseAI will merge them in your dashboard.`,
    },
  ];

  return (
    <>
      <HowToJsonLd bank={bank} />

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

        <main className="mx-auto max-w-4xl px-6 py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-zinc-500">
              <li><Link href="/" className="hover:text-zinc-300">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/banks" className="hover:text-zinc-300">Banks</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-zinc-300" aria-current="page">{bank.name}</li>
            </ol>
          </nav>

          <article>
            {/* Hero */}
            <header className="mb-12">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">{bank.flag}</span>
                <span className="rounded-full border border-zinc-700/50 bg-zinc-800/50 px-3 py-1 text-xs font-medium text-zinc-400">
                  {bank.country === "EU" ? "Europe" : bank.country === "UK" ? "United Kingdom" : bank.country === "AU" ? "Australia" : bank.country === "CA" ? "Canada" : "United States"}
                </span>
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-5xl">
                How to Import {bank.name} Transactions into ExpenseAI
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-zinc-400">
                Step-by-step guide to export your {bank.name} statement as CSV
                and get AI-powered categorization and spending insights in seconds.
                No bank connection required.
              </p>
            </header>

            {/* Steps */}
            <section aria-labelledby="steps-heading" className="mb-12">
              <h2 id="steps-heading" className="mb-6 text-2xl font-bold text-zinc-50">
                How to export from {bank.name}
              </h2>
              <div className="space-y-4">
                {bank.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-4 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm font-bold text-cyan-400">
                      {i + 1}
                    </span>
                    <p className="pt-0.5 leading-relaxed text-zinc-300">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* CSV columns */}
            <section aria-labelledby="columns-heading" className="mb-12">
              <h2 id="columns-heading" className="mb-4 text-2xl font-bold text-zinc-50">
                What your {bank.name} CSV looks like
              </h2>
              <p className="mb-4 text-zinc-400">
                {bank.name} exports a CSV with the following columns:
              </p>
              <div className="overflow-x-auto rounded-xl border border-zinc-700/50 bg-zinc-900 p-5">
                <code className="font-mono text-sm text-cyan-300">
                  {bank.csvColumns}
                </code>
              </div>
              <p className="mt-4 text-sm text-zinc-500">
                ExpenseAI automatically detects these columns — no manual mapping required.
              </p>
            </section>

            {/* Tips */}
            {bank.tips && (
              <section aria-labelledby="tips-heading" className="mb-12">
                <h2 id="tips-heading" className="mb-4 text-2xl font-bold text-zinc-50">
                  Tips for {bank.name} imports
                </h2>
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-5">
                  <p className="leading-relaxed text-zinc-300">{bank.tips}</p>
                </div>
              </section>
            )}

            {/* CTA */}
            <section
              aria-labelledby="cta-heading"
              className="mb-12 rounded-2xl border border-zinc-700/50 bg-zinc-900 p-8 text-center"
            >
              <h2 id="cta-heading" className="mb-3 text-2xl font-bold text-zinc-50">
                Ready to import your {bank.name} transactions?
              </h2>
              <p className="mb-6 text-zinc-400">
                Create a free account, upload your CSV, and get AI-powered categorization in under 30 seconds.
              </p>
              <Link
                href="/signup"
                className="inline-block rounded-xl bg-cyan-400 px-8 py-3.5 text-base font-semibold text-zinc-950 transition-colors hover:bg-cyan-300"
              >
                Start tracking free →
              </Link>
              <p className="mt-3 text-sm text-zinc-500">No credit card required. Free plan includes 3 imports/month.</p>
            </section>

            {/* FAQ */}
            <section aria-labelledby="faq-heading" className="mb-12">
              <h2 id="faq-heading" className="mb-6 text-2xl font-bold text-zinc-50">
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
                      <span className="shrink-0 text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-6 pb-5 text-zinc-400 leading-relaxed">{faq.a}</div>
                  </details>
                ))}
              </div>
            </section>

            {/* Related banks */}
            {relatedBanks.length > 0 && (
              <section aria-labelledby="related-heading">
                <h2 id="related-heading" className="mb-4 text-lg font-semibold text-zinc-400">
                  Also works with
                </h2>
                <div className="flex flex-wrap gap-2">
                  {relatedBanks.map((b) => (
                    <Link
                      key={b.slug}
                      href={`/banks/${b.slug}`}
                      className="flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                    >
                      <span aria-hidden="true">{b.flag}</span>
                      {b.name}
                    </Link>
                  ))}
                  <Link
                    href="/banks"
                    className="rounded-full border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                  >
                    See all banks →
                  </Link>
                </div>
              </section>
            )}
          </article>
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-zinc-800/50 bg-zinc-950 px-6 py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
            <Link href="/" className="text-base font-bold text-zinc-50">
              Expense<span className="text-cyan-400">AI</span>
            </Link>
            <Link href="/banks" className="text-sm text-zinc-500 hover:text-zinc-300">
              ← All supported banks
            </Link>
            <p className="text-sm text-zinc-600">
              &copy; {new Date().getFullYear()} ExpenseAI. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
