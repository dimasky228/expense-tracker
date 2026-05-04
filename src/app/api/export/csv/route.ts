import { createClient } from "@/src/lib/supabase/server";
import type { Transaction } from "@/src/types/transaction";

function escapeField(value: string | number, sep: string): string {
  const s = String(value ?? "");
  if (sep === "\t") return s.replace(/\t|\n|\r/g, " ");
  if (s.includes(",") || s.includes('"') || s.includes("\n"))
    return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function resolveDateRange(searchParams: URLSearchParams): {
  from: string | null;
  to: string | null;
  label: string;
} {
  const month = searchParams.get("month");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    return {
      from: new Date(y, m - 1, 1).toISOString().split("T")[0]!,
      to: new Date(y, m, 0).toISOString().split("T")[0]!,
      label: new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" }),
    };
  }
  if (from && to) return { from, to, label: `${from}-to-${to}` };
  return { from: null, to: null, label: "all-transactions" };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "tsv" ? "tsv" : "csv";
  const sep = format === "tsv" ? "\t" : ",";
  const { from, to, label } = resolveDateRange(searchParams);

  let query = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data } = await query;
  const txns = (data ?? []) as Transaction[];

  const e = (v: string | number) => escapeField(v, sep);

  const header = ["Date", "Description", "Category", "Type", "Amount", "Account"].map(e).join(sep);
  const rows = txns.map((t) =>
    [
      t.date,
      e(t.description ?? t.category),
      e(t.category),
      t.type,
      Number(t.amount).toFixed(2),
      e(t.account ?? ""),
    ].join(sep)
  );

  const content = [header, ...rows].join("\n");
  const ext = format === "tsv" ? "tsv" : "csv";
  const filename = `ExpenseAI-${label}.${ext}`;

  return new Response(content, {
    headers: {
      "Content-Type": format === "tsv" ? "text/tab-separated-values; charset=utf-8" : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
