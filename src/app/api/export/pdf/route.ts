import { NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { getAuthUser } from "@/src/lib/api-auth";
import { getSubscription, getUsageLimits } from "@/src/lib/subscription";
import MonthlyReport from "@/src/components/pdf/MonthlyReport";
import type { Transaction } from "@/src/types/transaction";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month"); // YYYY-MM

  const { user, supabase, error: authError } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: authError ?? "Unauthorized" }, { status: 401 });

  const sub = await getSubscription(user.id, supabase);
  if (!getUsageLimits(sub).canExportPdf) {
    return NextResponse.json(
      { error: "PDF export is a Pro feature. Upgrade to unlock.", code: "PRO_REQUIRED" },
      { status: 403 }
    );
  }

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }

  const start = new Date(year, month, 1).toISOString().split("T")[0];
  const end = new Date(year, month + 1, 0).toISOString().split("T")[0];

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });

  const txns = (transactions ?? []) as Transaction[];

  const expenses = txns.filter((t) => t.type === "expense");
  const totalSpent = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = txns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const net = totalIncome - totalSpent;

  const catMap = expenses.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + Number(t.amount);
      return acc;
    },
    {} as Record<string, number>
  );
  const categoryData = Object.entries(catMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthLabel = new Date(year, month, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const monthSlug = `${year}-${String(month + 1).padStart(2, "0")}`;

  const doc = createElement(MonthlyReport, {
    month: monthSlug,
    monthLabel,
    totalSpent,
    totalIncome,
    net,
    categoryData,
    transactions: txns,
  });

  const buffer = await renderToBuffer(doc as ReactElement<DocumentProps>);

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="expenseai-${monthSlug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
