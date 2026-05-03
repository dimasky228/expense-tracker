import { createClient } from "@/src/lib/supabase/server";
import type { RecurringItem } from "@/src/types/recurring";

export type DetectedRecurring = {
  name: string;
  amount: number;
  category: string;
  frequency: RecurringItem["frequency"];
  lastDate: string;
  nextDate: string;
  occurrences: number;
};

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function guessFrequency(avgIntervalDays: number): RecurringItem["frequency"] {
  if (avgIntervalDays <= 10) return "weekly";
  if (avgIntervalDays <= 45) return "monthly";
  return "yearly";
}

function frequencyDays(freq: RecurringItem["frequency"]): number {
  if (freq === "weekly") return 7;
  if (freq === "monthly") return 30;
  return 365;
}

export async function detectRecurring(
  userId: string,
  existingNames: Set<string>
): Promise<DetectedRecurring[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("transactions")
    .select("description, amount, date, category")
    .eq("user_id", userId)
    .eq("type", "expense")
    .neq("category", "Transfer")
    .order("date", { ascending: true });

  if (!data || data.length === 0) return [];

  // Group by normalized description
  type Row = { description: string; amount: number; date: string; category: string };
  const groups = new Map<string, Row[]>();

  for (const row of data as Row[]) {
    if (!row.description) continue;
    const key = normalize(row.description);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const results: DetectedRecurring[] = [];

  for (const [key, rows] of groups) {
    // Need 2+ different calendar months
    const months = new Set(rows.map((r) => r.date.slice(0, 7)));
    if (months.size < 2) continue;

    // Amount variance check: all amounts within 20% of median
    const amounts = rows.map((r) => Number(r.amount)).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    const allClose = amounts.every((a) => Math.abs(a - median) / median <= 0.2);
    if (!allClose) continue;

    // Already tracked — skip
    if (existingNames.has(key)) continue;

    // Calculate average interval
    const dates = rows.map((r) => new Date(r.date + "T00:00:00Z").getTime()).sort((a, b) => a - b);
    let avgInterval = 30;
    if (dates.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
      }
      avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    }

    const frequency = guessFrequency(avgInterval);
    const avgAmount = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const lastDate = rows[rows.length - 1].date;
    const nextDate = addDays(lastDate, frequencyDays(frequency));
    const category = rows[rows.length - 1].category;

    // Use the original (un-normalized) description from the most recent row as the display name
    const displayName = rows[rows.length - 1].description ?? key;

    results.push({
      name: displayName,
      amount: Math.round(avgAmount * 100) / 100,
      category,
      frequency,
      lastDate,
      nextDate,
      occurrences: rows.length,
    });
  }

  // Sort by amount descending, limit to 20
  return results.sort((a, b) => b.amount - a.amount).slice(0, 20);
}
