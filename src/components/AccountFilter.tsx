"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function AccountFilter({
  accounts,
  currentAccount,
}: {
  accounts: string[];
  currentAccount: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (accounts.length === 0) return null;

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("upgraded");
    if (value === "all") {
      params.delete("account");
    } else {
      params.set("account", value);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(`/dashboard${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <div className={`flex items-center gap-2 transition-opacity ${isPending ? "opacity-50" : ""}`}>
      <span className="shrink-0 text-xs text-zinc-500">Account:</span>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => onChange("all")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            !currentAccount
              ? "bg-cyan-400/20 text-cyan-400 ring-1 ring-cyan-400/30"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          All accounts
        </button>
        {accounts.map((a) => (
          <button
            key={a}
            onClick={() => onChange(a)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              currentAccount === a
                ? "bg-cyan-400/20 text-cyan-400 ring-1 ring-cyan-400/30"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
