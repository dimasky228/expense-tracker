import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { banksByRegion } from "@/src/lib/banks";
import LanguageSwitcher from "@/src/components/LanguageSwitcher";

export const dynamic = "force-dynamic";

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

const regionLabels: Record<string, { en: string; ru: string }> = {
  "United States": { en: "United States", ru: "США" },
  Europe: { en: "Europe", ru: "Европа" },
  "United Kingdom": { en: "United Kingdom", ru: "Великобритания" },
  Australia: { en: "Australia", ru: "Австралия" },
  Canada: { en: "Canada", ru: "Канада" },
};

export default async function BanksPage() {
  const t = await getTranslations("banks");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-zinc-50">
            Expense<span className="text-cyan-400">AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher locale={locale} />
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-50">
              {tNav("signIn")}
            </Link>
            <Link href="/signup" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300">
              {tNav("getStarted")}
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan-400">
            {t("heroLabel")}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
            {t("heroSubtitle")}
          </p>
        </div>

        <div className="space-y-14">
          {Object.entries(banksByRegion).map(([region, regionBanks]) => {
            const regionLabel =
              regionLabels[region]?.[locale as "en" | "ru"] ?? region;
            return (
              <section key={region} aria-labelledby={`region-${region}`}>
                <div className="mb-6 flex items-center gap-4">
                  <h2
                    id={`region-${region}`}
                    className="text-sm font-semibold uppercase tracking-wider text-zinc-500"
                  >
                    {regionLabel}
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
                            {t("stepCount", { n: bank.steps.length })}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-zinc-600 transition-colors group-hover:text-cyan-400">
                        {t("seeAllBanks").replace(" →", " →").split("→")[0].trim()} →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section
          aria-labelledby="other-banks-heading"
          className="mt-16 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-8 text-center"
        >
          <h2 id="other-banks-heading" className="mb-3 text-xl font-bold text-zinc-50">
            {t("notListed")}
          </h2>
          <p className="mb-6 text-zinc-400">{t("notListedDesc")}</p>
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300"
          >
            {t("notListedCta")}
          </Link>
        </section>
      </main>

      <footer className="mt-16 border-t border-zinc-800/50 bg-zinc-950 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="text-base font-bold text-zinc-50">
            Expense<span className="text-cyan-400">AI</span>
          </Link>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
            {t("backHome")}
          </Link>
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} ExpenseAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
