const CURRENCY_KEY = "expenseai_currency";

export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD ($)", position: "before" as const },
  { code: "EUR", symbol: "€", label: "EUR (€)", position: "before" as const },
  { code: "GBP", symbol: "£", label: "GBP (£)", position: "before" as const },
  { code: "RUB", symbol: "₽", label: "RUB (₽)", position: "after" as const },
  { code: "KRW", symbol: "₩", label: "KRW (₩)", position: "before" as const },
  { code: "JPY", symbol: "¥", label: "JPY (¥)", position: "before" as const },
  { code: "CAD", symbol: "C$", label: "CAD (C$)", position: "before" as const },
  { code: "AUD", symbol: "A$", label: "AUD (A$)", position: "before" as const },
];

const byCode = new Map(CURRENCIES.map((c) => [c.code, c]));

export function getCurrency(): string {
  if (typeof window === "undefined") return "USD";
  return localStorage.getItem(CURRENCY_KEY) ?? "USD";
}

export function setCurrency(code: string): void {
  localStorage.setItem(CURRENCY_KEY, code);
}

export function formatAmount(amount: number, currencyCode?: string): string {
  const code = currencyCode ?? getCurrency();
  const info = byCode.get(code);
  const abs = Math.abs(amount).toFixed(2);
  if (!info) return `${code} ${abs}`;
  return info.position === "before" ? `${info.symbol}${abs}` : `${abs} ${info.symbol}`;
}
