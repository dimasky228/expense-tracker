"use client";

import { useState, useEffect } from "react";

const DISMISSED_KEY = "expenseai_install_dismissed";

type Platform = "android" | "ios" | null;

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return null;
}

function isInStandaloneMode(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as { standalone?: boolean }).standalone === true))
  );
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<Event & {
    prompt: () => void;
    userChoice: Promise<{ outcome: string }>;
  } | null>(null);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as typeof deferredPrompt);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show iOS instructions after a short delay
    if (detectedPlatform === "ios") {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm">
      <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900 p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
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
                d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-100">
              Install ExpenseAI
            </p>

            {platform === "ios" ? (
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Tap{" "}
                <span className="inline-flex items-center gap-0.5 text-zinc-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="inline h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                    />
                  </svg>{" "}
                  Share
                </span>{" "}
                then{" "}
                <span className="text-zinc-300">Add to Home Screen</span> for
                quick access
              </p>
            ) : (
              <p className="mt-1 text-xs text-zinc-400">
                Add to home screen for quick access — works offline too
              </p>
            )}
          </div>

          <button
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Dismiss"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {!platform && deferredPrompt && (
          <button
            onClick={install}
            className="mt-3 w-full rounded-xl bg-cyan-400 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300"
          >
            Install app
          </button>
        )}
      </div>
    </div>
  );
}
