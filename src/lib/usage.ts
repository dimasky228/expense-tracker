import { createClient } from "@/src/lib/supabase/server";
import type { AppSupabaseClient } from "@/src/lib/api-auth";

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getImportCount(
  userId: string,
  month: string,
  client?: AppSupabaseClient
): Promise<number> {
  const supabase = client ?? (await createClient());
  const { data } = await supabase
    .from("usage")
    .select("csv_imports")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  return data?.csv_imports ?? 0;
}

export async function incrementImportCount(
  userId: string,
  month: string,
  client?: AppSupabaseClient
): Promise<void> {
  const supabase = client ?? (await createClient());
  const current = await getImportCount(userId, month, supabase);
  await supabase.from("usage").upsert(
    { user_id: userId, month, csv_imports: current + 1 },
    { onConflict: "user_id,month" }
  );
}

export async function getReceiptScanCount(
  userId: string,
  month: string,
  client?: AppSupabaseClient
): Promise<number> {
  const supabase = client ?? (await createClient());
  const { data } = await supabase
    .from("usage")
    .select("receipt_scans")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  return data?.receipt_scans ?? 0;
}

export async function incrementReceiptScanCount(
  userId: string,
  month: string,
  client?: AppSupabaseClient
): Promise<void> {
  const supabase = client ?? (await createClient());
  const current = await getReceiptScanCount(userId, month, supabase);
  await supabase.from("usage").upsert(
    { user_id: userId, month, receipt_scans: current + 1 },
    { onConflict: "user_id,month" }
  );
}
