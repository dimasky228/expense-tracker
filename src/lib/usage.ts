import { createClient } from "@/src/lib/supabase/server";

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getImportCount(userId: string, month: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("usage")
    .select("csv_imports")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  return data?.csv_imports ?? 0;
}

export async function incrementImportCount(userId: string, month: string): Promise<void> {
  const supabase = await createClient();
  const current = await getImportCount(userId, month);

  await supabase.from("usage").upsert(
    { user_id: userId, month, csv_imports: current + 1 },
    { onConflict: "user_id,month" }
  );
}

export async function getReceiptScanCount(userId: string, month: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("usage")
    .select("receipt_scans")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  return data?.receipt_scans ?? 0;
}

export async function incrementReceiptScanCount(userId: string, month: string): Promise<void> {
  const supabase = await createClient();
  const current = await getReceiptScanCount(userId, month);

  await supabase.from("usage").upsert(
    { user_id: userId, month, receipt_scans: current + 1 },
    { onConflict: "user_id,month" }
  );
}
