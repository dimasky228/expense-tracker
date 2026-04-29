"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  signInLabel: string;
  getStartedLabel: string;
  locale: string;
};

export default function MobileMenu({ signInLabel, getStartedLabel, locale }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-50 sm:hidden"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Slide-out panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <span className="text-lg font-bold text-zinc-50">
                Expense<span className="text-cyan-400">AI</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-3 p-5">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block rounded-xl border border-zinc-700 py-3 text-center text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50"
              >
                {signInLabel}
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="block rounded-xl bg-cyan-400 py-3 text-center text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300"
              >
                {getStartedLabel}
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
