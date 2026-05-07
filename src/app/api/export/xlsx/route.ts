export const runtime = "nodejs";

import * as XLSX from "xlsx";
import { getAuthUser } from "@/src/lib/api-auth";
import { getSubscription, isPro } from "@/src/lib/subscription";
import type { Transaction } from "@/src/types/transaction";

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
  if (from && to) return { from, to, label: `${from} to ${to}` };
  return { from: null, to: null, label: "All Time" };
}

export async function GET(request: Request) {
  const { user, supabase, error: authError } = await getAuthUser(request);
  if (!user) return Response.json({ error: authError ?? "Unauthorized" }, { status: 401 });

  const sub = await getSubscription(user.id, supabase);
  if (!isPro(sub)) {
    return Response.json({ error: "Excel export is a Pro feature.", code: "PRO_REQUIRED" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
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

  const wb = XLSX.utils.book_new();

  // Sheet 1 — Transactions
  const txnRows: (string | number)[][] = [
    ["Date", "Description", "Category", "Type", "Amount", "Account"],
    ...txns.map((t) => [
      t.date,
      t.description ?? t.category,
      t.category,
      t.type,
      Number(t.amount),
      t.account ?? "",
    ]),
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(txnRows);
  ws1["!cols"] = [
    { wch: 12 }, { wch: 40 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Transactions");

  // Sheet 2 — Summary
  const expenses = txns.filter((t) => t.type === "expense" && t.category !== "Transfer");
  const income = txns.filter((t) => t.type === "income");
  const totalSpent = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = income.reduce((s, t) => s + Number(t.amount), 0);
  const net = totalIncome - totalSpent;

  const catMap: Record<string, number> = {};
  for (const t of expenses) {
    catMap[t.category] = (catMap[t.category] ?? 0) + Number(t.amount);
  }
  const categoryRows = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => [cat, amt, totalSpent > 0 ? `${((amt / totalSpent) * 100).toFixed(1)}%` : "0%"]);

  // Monthly totals
  const monthMap: Record<string, { income: number; expense: number }> = {};
  for (const t of txns) {
    const ym = t.date.substring(0, 7);
    if (!monthMap[ym]) monthMap[ym] = { income: 0, expense: 0 };
    if (t.type === "income") monthMap[ym].income += Number(t.amount);
    else if (t.category !== "Transfer") monthMap[ym].expense += Number(t.amount);
  }
  const monthRows = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, { income: inc, expense: exp }]) => [ym, inc, exp, inc - exp]);

  const summaryRows: (string | number)[][] = [
    [`Summary — ${label}`],
    [],
    ["INCOME vs EXPENSES"],
    ["Total Income", totalIncome],
    ["Total Expenses", totalSpent],
    ["Net Savings", net],
    ["Savings Rate", totalIncome > 0 ? `${(((totalIncome - totalSpent) / totalIncome) * 100).toFixed(1)}%` : "—"],
    [],
    ["SPENDING BY CATEGORY"],
    ["Category", "Amount", "% of Total"],
    ...categoryRows,
    [],
    ["MONTHLY BREAKDOWN"],
    ["Month", "Income", "Expenses", "Net"],
    ...monthRows,
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws2["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  const arr = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as number[];
  const blob = new Blob([new Uint8Array(arr)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const slug = label.replace(/[^a-zA-Z0-9-]/g, "-");

  return new Response(blob, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ExpenseAI-${slug}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
