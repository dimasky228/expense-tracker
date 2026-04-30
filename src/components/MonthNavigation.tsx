"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  label: string;
  currentSlug: string;
  isCurrentMonth: boolean;
}

export default function MonthNavigation({ label, currentSlug, isCurrentMonth }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(direction: "prev" | "next") {
    const [year, month] = currentSlug.split("-").map(Number);
    let newYear = year;
    let newMonth = month;

    if (direction === "prev") {
      newMonth -= 1;
      if (newMonth === 0) { newMonth = 12; newYear -= 1; }
    } else {
      newMonth += 1;
      if (newMonth === 13) { newMonth = 1; newYear += 1; }
    }

    const slug = `${newYear}-${String(newMonth).padStart(2, "0")}`;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("upgraded");

    const now = new Date();
    const nowSlug = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    if (slug === nowSlug) {
      params.delete("month");
    } else {
      params.set("month", slug);
    }

    const qs = params.toString();
    router.push(`/dashboard${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => navigate("prev")}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        aria-label="Previous month"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
      </button>

      <span className="min-w-[140px] text-center text-xl font-bold text-zinc-50 sm:text-2xl">
        {label}
      </span>

      <button
        onClick={() => navigate("next")}
        disabled={isCurrentMonth}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Next month"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
