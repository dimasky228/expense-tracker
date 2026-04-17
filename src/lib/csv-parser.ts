export type ParsedRow = {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive = income, negative = expense
};

// Full CSV parser that handles quoted fields and CRLF/LF
function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field.trim());
        field = "";
      } else if (ch === "\r" && next === "\n") {
        row.push(field.trim());
        field = "";
        if (row.some(Boolean)) rows.push(row);
        row = [];
        i++; // skip \n
      } else if (ch === "\n" || ch === "\r") {
        row.push(field.trim());
        field = "";
        if (row.some(Boolean)) rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }
  // Flush last row
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);

  return rows;
}

function normalizeDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  // Already ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // MM/DD/YYYY  (US banks)
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) return `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;

  // MM-DD-YYYY
  const usDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (usDash)
    return `${usDash[3]}-${usDash[1].padStart(2, "0")}-${usDash[2].padStart(2, "0")}`;

  // Fallback to JS Date (handles "Jan 15, 2024", ISO w/ time, etc.)
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];

  return null;
}

function parseAmount(raw: string): number {
  const s = raw.trim().replace(/[$£€\s]/g, "").replace(/,(?=\d{3})/g, "");
  if (/^\([\d.]+\)$/.test(s)) return -parseFloat(s.slice(1, -1)); // (123.45)
  return parseFloat(s) || 0;
}

type ColumnIndices = {
  dateIdx: number;
  descIdx: number;
  amountIdx: number;
  debitIdx: number;
  creditIdx: number;
};

function detectColumns(headers: string[]): ColumnIndices | null {
  const h = headers.map((s) => s.toLowerCase().trim());

  const dateIdx = h.findIndex((v) =>
    [
      "date",
      "transaction date",
      "posted date",
      "value date",
      "trans. date",
      "trans date",
      "booking date",
      "settlement date",
    ].includes(v)
  );

  const descIdx = h.findIndex(
    (v) =>
      [
        "description",
        "memo",
        "payee",
        "details",
        "transaction description",
        "narrative",
        "reference",
        "merchant name",
        "particulars",
        "details/description",
      ].includes(v) ||
      v.includes("description") ||
      v.includes("memo") ||
      v.includes("payee") ||
      v.includes("narrat")
  );

  const amountIdx = h.findIndex((v) =>
    ["amount", "transaction amount", "amt", "net amount"].includes(v)
  );

  const debitIdx = h.findIndex((v) =>
    ["debit", "money out", "withdrawal", "debit amount", "outgoing", "debits"].includes(v)
  );

  const creditIdx = h.findIndex((v) =>
    ["credit", "money in", "deposit", "credit amount", "incoming", "credits"].includes(v)
  );

  if (dateIdx === -1 || descIdx === -1) return null;
  if (amountIdx === -1 && debitIdx === -1 && creditIdx === -1) return null;

  return { dateIdx, descIdx, amountIdx, debitIdx, creditIdx };
}

export function parseCSV(rawText: string): ParsedRow[] | { error: string } {
  // Strip BOM
  const text = rawText.replace(/^\uFEFF/, "");

  const rows = parseRows(text);
  if (rows.length < 2) {
    return { error: "CSV file is empty or has only one row." };
  }

  const headers = rows[0];
  const cols = detectColumns(headers);

  if (!cols) {
    return {
      error: `Could not detect required columns. Headers found: ${headers.join(", ")}. Ensure your CSV has Date, Description, and Amount (or Debit/Credit) columns.`,
    };
  }

  const { dateIdx, descIdx, amountIdx, debitIdx, creditIdx } = cols;
  const parsed: ParsedRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    const date = normalizeDate(row[dateIdx] ?? "");
    if (!date) continue;

    const description = row[descIdx]?.trim();
    if (!description) continue;

    let amount: number;
    if (amountIdx >= 0) {
      amount = parseAmount(row[amountIdx] ?? "0");
    } else {
      const debit = debitIdx >= 0 ? Math.abs(parseAmount(row[debitIdx] ?? "0")) : 0;
      const credit = creditIdx >= 0 ? Math.abs(parseAmount(row[creditIdx] ?? "0")) : 0;
      // Debit = money leaving (expense) → negative; credit = money arriving (income) → positive
      amount = credit > 0 ? credit : -debit;
    }

    if (amount === 0) continue;

    parsed.push({ date, description, amount });
  }

  return parsed;
}
