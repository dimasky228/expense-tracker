import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { detectRecurring } from "@/src/lib/recurring-detector";
import RecurringManager from "@/src/components/RecurringManager";
import type { RecurringItem } from "@/src/types/recurring";

export default async function RecurringPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("recurring")
    .select("*")
    .eq("user_id", user.id)
    .order("is_active", { ascending: false })
    .order("name");

  const items = (data ?? []) as RecurringItem[];
  const existingNames = new Set(items.map((i) => i.name.toLowerCase().trim()));

  const detected = await detectRecurring(user.id, existingNames);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-50">Subscriptions &amp; Recurring</h1>
        <p className="mt-1 text-sm text-zinc-400">Track what you pay regularly</p>
      </div>

      <RecurringManager initialItems={items} detected={detected} />
    </div>
  );
}
