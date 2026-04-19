"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UpgradeSuccessToast({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(show);
  const router = useRouter();

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => {
      setVisible(false);
      // Remove ?upgraded=true from URL
      router.replace("/dashboard");
    }, 5000);
    return () => clearTimeout(timer);
  }, [show, router]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-zinc-900 px-5 py-4 shadow-2xl shadow-black/50">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-100">Welcome to Pro!</p>
        <p className="text-xs text-zinc-400">AI insights and unlimited imports are now unlocked.</p>
      </div>
      <button
        onClick={() => { setVisible(false); router.replace("/dashboard"); }}
        className="ml-2 text-zinc-500 hover:text-zinc-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
