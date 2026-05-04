import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import SplitsManager from "@/src/components/SplitsManager";
import type { SplitWithParticipants, SplitParticipant } from "@/src/types/splits";
import type { Transaction } from "@/src/types/transaction";

export default async function SplitsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; txn_id?: string; amount?: string; desc?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;

  const [{ data: splitsRaw }, { data: participantsRaw }, { data: txnsRaw }] = await Promise.all([
    supabase
      .from("splits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("split_participants")
      .select("*")
      .in(
        "split_id",
        // We need split ids, but joining is simpler via a subquery approach
        // Use a workaround: fetch all participants for user's splits
        (
          await supabase.from("splits").select("id").eq("user_id", user.id)
        ).data?.map((s: { id: string }) => s.id) ?? []
      ),
    supabase
      .from("transactions")
      .select("id, description, category, amount, date, type, account, user_id, created_at, original_description, import_hash")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .order("date", { ascending: false })
      .limit(30),
  ]);

  const participantsBySplit: Record<string, SplitParticipant[]> = {};
  for (const p of (participantsRaw ?? []) as SplitParticipant[]) {
    if (!participantsBySplit[p.split_id]) participantsBySplit[p.split_id] = [];
    participantsBySplit[p.split_id].push(p);
  }

  const splits: SplitWithParticipants[] = ((splitsRaw ?? []) as Omit<SplitWithParticipants, "participants">[]).map(
    (s) => ({ ...s, participants: participantsBySplit[s.id] ?? [] })
  );

  const prefill =
    params.new === "1" && params.amount
      ? { txn_id: params.txn_id ?? null, amount: params.amount, desc: decodeURIComponent(params.desc ?? "") }
      : null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-50">Split Expenses</h1>
        <p className="mt-1 text-sm text-zinc-400">Track shared expenses and who owes you</p>
      </div>

      <SplitsManager
        initialSplits={splits}
        recentTransactions={(txnsRaw ?? []) as Transaction[]}
        prefill={prefill}
      />
    </div>
  );
}
