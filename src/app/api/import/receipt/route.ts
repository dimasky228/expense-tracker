import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/src/lib/supabase/server";
import { getSubscription, getUsageLimits } from "@/src/lib/subscription";
import {
  getReceiptScanCount,
  incrementReceiptScanCount,
  currentMonth,
} from "@/src/lib/usage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

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
  "Other",
];

type ReceiptResult = {
  merchant_name: string;
  date: string;
  total: number;
  currency: string;
  category: string;
  type: "expense" | "income";
  confidence: "high" | "medium" | "low";
  items?: { name: string; quantity: number; price: number }[];
  raw_text?: string;
};

const SYSTEM_PROMPT = `You are a receipt/invoice data extractor. Analyze this receipt or invoice image/document and extract:

1. merchant_name: The store or service name
2. date: Transaction date (format: YYYY-MM-DD). If only month/year visible, use the 1st of that month.
3. total: Total amount paid (number only, no currency symbols)
4. currency: Currency code (USD, EUR, GBP, RUB, etc.) — detect from symbols or context
5. category: One of: ${CATEGORIES.join(", ")}
6. type: "expense" or "income" (almost always "expense" for receipts)
7. items: Array of line items if clearly visible: [{name, quantity, price}] — omit if not readable
8. confidence: "high" if data is clearly readable, "medium" if some fields are uncertain, "low" if mostly guessing

Return ONLY valid JSON with no markdown fences:
{
  "merchant_name": "...",
  "date": "YYYY-MM-DD",
  "total": 0.00,
  "currency": "USD",
  "category": "...",
  "type": "expense",
  "confidence": "high",
  "items": [],
  "raw_text": "brief one-line summary of what you read"
}

If this is not a receipt or invoice, return:
{"error": "This doesn't appear to be a receipt or invoice"}`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check receipt scan limit for free users
  const sub = await getSubscription(user.id);
  const limits = getUsageLimits(sub);
  if (limits.receiptScansPerMonth !== Infinity) {
    const month = currentMonth();
    const used = await getReceiptScanCount(user.id, month);
    if (used >= limits.receiptScansPerMonth) {
      return NextResponse.json(
        {
          error: `Free plan allows ${limits.receiptScansPerMonth} receipt scans per month. Upgrade to Pro for unlimited scans.`,
          code: "LIMIT_REACHED",
          used,
          limit: limits.receiptScansPerMonth,
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

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload an image (JPG, PNG, WebP, HEIC) or PDF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10 MB." },
      { status: 400 }
    );
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const client = new Anthropic();
  const isPdf = file.type === "application/pdf";

  type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const contentBlock = isPdf
    ? ({
        type: "document" as const,
        source: {
          type: "base64" as const,
          media_type: "application/pdf" as const,
          data: base64,
        },
      })
    : ({
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: (file.type === "image/heic" ? "image/jpeg" : file.type) as ImageMediaType,
          data: base64,
        },
      });

  let result: ReceiptResult;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            contentBlock,
            { type: "text", text: "Extract the receipt data from this image/document." },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from AI");
    }

    const text = content.text.trim();

    // Strip markdown fences if AI returns them anyway
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as ReceiptResult & { error?: string };

    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 422 });
    }

    // Validate category
    if (!CATEGORIES.includes(parsed.category)) {
      parsed.category = "Other";
    }

    result = parsed;
  } catch (err) {
    console.error("[receipt/route] AI error:", err);
    return NextResponse.json(
      {
        error: `AI processing failed: ${err instanceof Error ? err.message : "unknown error"}`,
      },
      { status: 500 }
    );
  }

  // Increment usage counter
  await incrementReceiptScanCount(user.id, currentMonth());

  return NextResponse.json(result);
}
