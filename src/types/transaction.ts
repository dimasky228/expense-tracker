export type TransactionType = "expense" | "income";

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string | null;
  date: string; // YYYY-MM-DD
  created_at: string;
  account: string | null;
  original_description: string | null;
  import_hash: string | null;
};

// Returned by the AI categorization API, used in the review/import flow
export type CategorizedTransaction = {
  date: string;
  description: string;
  originalDescription: string;
  category: string;
  type: TransactionType;
  amount: number;
  account: string;
  importHash: string;
};

export type PotentialTransfer = {
  importedHash: string;
  existingAccount: string;
  existingDate: string;
  existingAmount: number;
  existingDescription: string;
};

export type ImportResult = {
  transactions: CategorizedTransaction[];
  duplicateCount: number;
  duplicates: { date: string; description: string; amount: number }[];
  potentialTransfers: PotentialTransfer[];
};
