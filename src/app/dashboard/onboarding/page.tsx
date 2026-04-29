"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CURRENCIES, getCurrency, setCurrency } from "@/src/lib/currency";

const ONBOARDING_KEY = "onboarding_completed";
const TOTAL_STEPS = 4;

type Step = 1 | 2 | 3 | 4;
type Step3Choice = "import" | "manual" | "skip";

function StepDots({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2">
      {([1, 2, 3, 4] as Step[]).map((s) => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all ${
            s === current
              ? "w-6 bg-cyan-400"
              : s < current
              ? "w-1.5 bg-cyan-400/40"
              : "w-1.5 bg-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [customCurrency, setCustomCurrency] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem(ONBOARDING_KEY) === "true") {
      router.replace("/dashboard");
      return;
    }
    setSelectedCurrency(getCurrency());
  }, [router]);

  function completeOnboarding() {
    const code = showCustom && customCurrency.trim()
      ? customCurrency.trim().toUpperCase()
      : selectedCurrency;
    setCurrency(code);
    localStorage.setItem(ONBOARDING_KEY, "true");
    router.push("/dashboard");
  }

  function handleStep3Choice(choice: Step3Choice) {
    if (choice === "import") {
      localStorage.setItem("onboarding_intent", "import");
    } else if (choice === "manual") {
      localStorage.setItem("onboarding_intent", "add");
    }
    setStep(4);
  }

  if (!mounted) return null;

  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-between">
          <StepDots current={step} />
          <span className="text-xs text-zinc-600">
            {t("stepOf", { current: step, total: TOTAL_STEPS })}
          </span>
        </div>

        {/* ── Step 1: Welcome ── */}
        {step === 1 && (
          <div className="text-center">
            {/* Illustration */}
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-cyan-400/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-12 w-12 text-cyan-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-zinc-50">{t("step1Title")}</h1>
            <p className="mt-3 text-lg text-zinc-400">{t("step1Subtitle")}</p>
            <button
              onClick={() => setStep(2)}
              className="mt-10 w-full rounded-2xl bg-cyan-400 py-4 text-base font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 sm:w-auto sm:px-12"
            >
              {t("step1Button")}
            </button>
          </div>
        )}

        {/* ── Step 2: Currency ── */}
        {step === 2 && (
          <div>
            <h1 className="mb-2 text-2xl font-bold text-zinc-50 sm:text-3xl">
              {t("step2Title")}
            </h1>
            <p className="mb-8 text-zinc-400">{t("step2Subtitle")}</p>

            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setSelectedCurrency(c.code);
                    setShowCustom(false);
                  }}
                  className={`rounded-xl border py-4 text-center transition-colors ${
                    !showCustom && selectedCurrency === c.code
                      ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                      : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  <span className="block text-xl font-bold">{c.symbol}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">{c.code}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  setShowCustom(true);
                  setSelectedCurrency("");
                }}
                className={`rounded-xl border py-4 text-center transition-colors sm:col-span-2 ${
                  showCustom
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                <span className="block text-sm font-medium">{t("step2Other")}</span>
              </button>
            </div>

            {showCustom && (
              <input
                type="text"
                autoFocus
                maxLength={8}
                value={customCurrency}
                onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
                placeholder={t("step2OtherPlaceholder")}
                className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-50 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
              />
            )}

            <button
              onClick={() => setStep(3)}
              disabled={showCustom && !customCurrency.trim()}
              className="mt-2 w-full rounded-2xl bg-cyan-400 py-4 text-base font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("step2Next")}
            </button>
          </div>
        )}

        {/* ── Step 3: First data ── */}
        {step === 3 && (
          <div>
            <h1 className="mb-2 text-2xl font-bold text-zinc-50 sm:text-3xl">
              {t("step3Title")}
            </h1>
            <p className="mb-8 text-zinc-400">{t("step3Subtitle")}</p>

            <div className="space-y-3">
              {/* Option A: Import CSV */}
              <button
                onClick={() => handleStep3Choice("import")}
                className="flex w-full items-center gap-4 rounded-2xl border border-zinc-700 bg-zinc-900/50 p-5 text-left transition-colors hover:border-cyan-400/50 hover:bg-zinc-900"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">{t("step3OptionA")}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">{t("step3OptionADesc")}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="ml-auto h-4 w-4 shrink-0 text-zinc-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              {/* Option B: Add manually */}
              <button
                onClick={() => handleStep3Choice("manual")}
                className="flex w-full items-center gap-4 rounded-2xl border border-zinc-700 bg-zinc-900/50 p-5 text-left transition-colors hover:border-zinc-500 hover:bg-zinc-900"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-700/50 text-zinc-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">{t("step3OptionB")}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">{t("step3OptionBDesc")}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="ml-auto h-4 w-4 shrink-0 text-zinc-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              {/* Option C: Skip */}
              <button
                onClick={() => handleStep3Choice("skip")}
                className="flex w-full items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 text-left transition-colors hover:border-zinc-700"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-zinc-400">{t("step3OptionC")}</p>
                  <p className="mt-0.5 text-sm text-zinc-600">{t("step3OptionCDesc")}</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === 4 && (
          <div className="text-center">
            {/* Checkmark animation */}
            <div className="animate-check-pop mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-400/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-12 w-12 text-emerald-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-zinc-50">{t("step4Title")}</h1>
            <p className="mt-3 text-zinc-400">{t("step4Subtitle")}</p>

            {/* Tips */}
            <div className="mt-8 space-y-3 text-left">
              {[
                { icon: "📊", tip: t("tip1") },
                { icon: "💡", tip: t("tip2") },
                { icon: "📱", tip: t("tip3") },
              ].map(({ icon, tip }) => (
                <div
                  key={tip}
                  className="flex items-start gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3"
                >
                  <span className="text-lg" aria-hidden="true">{icon}</span>
                  <p className="text-sm leading-relaxed text-zinc-400">{tip}</p>
                </div>
              ))}
            </div>

            <button
              onClick={completeOnboarding}
              className="mt-8 w-full rounded-2xl bg-cyan-400 py-4 text-base font-semibold text-zinc-950 transition-colors hover:bg-cyan-300"
            >
              {t("step4Button")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
