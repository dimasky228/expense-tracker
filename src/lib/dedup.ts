import { createHash } from "crypto";
import type { ParsedRow } from "@/src/lib/csv-parser";
import type { PotentialTransfer } from "@/src/types/transaction";

export function generateImportHash(
  date: string,
  amount: number,
  description: string
): string {
  return createHash("md5")
    .update(`${date}|${amount}|${description}`)
    .digest("hex");
}

type ExistingTransaction = {
  import_hash: string | null;
  date: string;
  amount: number;
  type: string;
  description: string | null;
  account: string | null;
};

export function findDuplicates(
  rows: (ParsedRow & { hash: string })[],
  existing: ExistingTransaction[]
): { duplicates: (ParsedRow & { hash: string })[]; newRows: (ParsedRow & { hash: string })[] } {
  const existingHashes = new Set(
    existing.map((e) => e.import_hash).filter(Boolean) as string[]
  );

  const duplicates: (ParsedRow & { hash: string })[] = [];
  const newRows: (ParsedRow & { hash: string })[] = [];

  for (const row of rows) {
    if (existingHashes.has(row.hash)) {
      duplicates.push(row);
    } else {
      newRows.push(row);
    }
  }

  return { duplicates, newRows };
}

export function findPotentialTransfers(
  newRows: (ParsedRow & { hash: string })[],
  account: string,
  existing: ExistingTransaction[]
): PotentialTransfer[] {
  // Only consider existing transactions from OTHER accounts that have account set
  const candidates = existing.filter(
    (e) => e.account && e.account !== account
  );

  const transfers: PotentialTransfer[] = [];
  const matchedExistingIds = new Set<string>(); // prevent double-matching

  for (const row of newRows) {
    const absAmount = Math.abs(row.amount);
    const isOutgoing = row.amount < 0;

    for (const ex of candidates) {
      const exAbsAmount = Math.abs(Number(ex.amount));
      if (Math.abs(exAbsAmount - absAmount) > 0.001) continue;

      // Opposite direction: outgoing imported ↔ incoming existing, or vice versa
      const isOpposite = isOutgoing
        ? ex.type === "income"
        : ex.type === "expense";
      if (!isOpposite) continue;

      // Within 1 day
      const rowMs = new Date(row.date + "T00:00:00").getTime();
      const exMs = new Date(ex.date + "T00:00:00").getTime();
      const daysDiff = Math.abs(rowMs - exMs) / (1000 * 60 * 60 * 24);
      if (daysDiff > 1) continue;

      // Avoid matching the same existing transaction to multiple imported rows
      const exKey = `${ex.date}|${ex.amount}|${ex.description}`;
      if (matchedExistingIds.has(exKey)) continue;

      matchedExistingIds.add(exKey);
      transfers.push({
        importedHash: row.hash,
        existingAccount: ex.account!,
        existingDate: ex.date,
        existingAmount: Math.abs(Number(ex.amount)),
        existingDescription: ex.description ?? "",
      });
      break; // one match per imported row
    }
  }

  return transfers;
}
