"use client";

import { useTransition } from "react";

export default function LanguageSwitcher({ locale }: { locale: string }) {
  const [isPending, startTransition] = useTransition();

  async function switchLocale(newLocale: string) {
    await fetch("/api/set-locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: newLocale }),
    });
    startTransition(() => {
      window.location.reload();
    });
  }

  return (
    <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-900 p-0.5">
      {(["en", "ru"] as const).map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          disabled={isPending || locale === l}
          className={`rounded-md px-2 py-0.5 text-xs font-medium uppercase transition-colors ${
            locale === l
              ? "bg-zinc-700 text-zinc-50"
              : "text-zinc-500 hover:text-zinc-200"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
