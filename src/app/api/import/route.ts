import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/src/lib/supabase/server";
import { parseCSV } from "@/src/lib/csv-parser";
import { getSubscription, getUsageLimits } from "@/src/lib/subscription";
import { getImportCount, incrementImportCount, currentMonth } from "@/src/lib/usage";
import type { CategorizedTransaction, TransactionType } from "@/src/types/transaction";

const CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Transport",
  "Housing",
  "Entertainment",
  "Shopping",
  "Health",
  "Utilities",
  "Subscriptions",
  "Education",
  "Travel",
  "Transfer",
  "Salary",
  "Freelance",
  "Investment",
  "Other",
];

type AIResult = {
  index: number;
  category: string;
  type: TransactionType;
  description: string;
};

async function categorizeWithAI(
  transactions: { description: string; amount: number }[]
): Promise<AIResult[]> {
  const client = new Anthropic();

  const list = transactions
    .map(
      (t, i) =>
        `[${i}] "${t.description}" ${t.amount >= 0 ? "+" : ""}${t.amount.toFixed(2)}`
    )
    .join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a financial transaction categorizer.

Available categories: ${CATEGORIES.join(", ")}

Rules:
- Negative amounts are typically expenses, positive are typically income
- Use "Transfer" for money moved between own accounts
- Use "Salary"/"Freelance" only when clearly a payment received for work
- Return a clean short merchant/payee name (max 40 chars)

Transactions:
${list}

Return ONLY a valid JSON array — no prose, no markdown fences:
[{"index":0,"category":"Food & Dining","type":"expense","description":"McDonald's"},...]`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from AI");

  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("AI response did not contain a JSON array");

  return JSON.parse(jsonMatch[0]) as AIResult[];
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check CSV import limit for free users
  const sub = await getSubscription(user.id);
  const limits = getUsageLimits(sub);
  if (limits.csvImportsPerMonth !== Infinity) {
    const month = currentMonth();
    const used = await getImportCount(user.id, month);
    if (used >= limits.csvImportsPerMonth) {
      return NextResponse.json(
        {
          error: `Free plan allows ${limits.csvImportsPerMonth} CSV imports per month. Upgrade to Pro for unlimited imports.`,
          code: "LIMIT_REACHED",
        },
        { status: 403 }
      );
    }
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json({ error: "File must be a .csv" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }

  const text = await file.text();
  if (!text.trim()) {
    return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
  }

  const parsed = parseCSV(text);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 422 });
  }
  if (parsed.length === 0) {
    return NextResponse.json(
      { error: "No valid transactions found in this CSV" },
      { status: 422 }
    );
  }

  // Categorize in batches of 100
  const BATCH = 100;
  const categorized: CategorizedTransaction[] = [];

  for (let i = 0; i < parsed.length; i += BATCH) {
    const batch = parsed.slice(i, i + BATCH);
    let aiResults: AIResult[];

    try {
      aiResults = await categorizeWithAI(
        batch.map((t) => ({ description: t.description, amount: t.amount }))
      );
    } catch (err) {
      return NextResponse.json(
        { error: `AI categorization failed: ${err instanceof Error ? err.message : "unknown error"}` },
        { status: 500 }
      );
    }

    for (const result of aiResults) {
      const row = batch[result.index];
      if (!row) continue;

      categorized.push({
        date: row.date,
        description: result.description || row.description,
        category: CATEGORIES.includes(result.category) ? result.category : "Other",
        type: result.type === "income" ? "income" : "expense",
        amount: Math.abs(row.amount),
      });
    }
  }

  // Increment usage counter
  await incrementImportCount(user.id, currentMonth());

  return NextResponse.json({ transactions: categorized, count: categorized.length });
}
