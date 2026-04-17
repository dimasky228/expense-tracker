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
};

// Returned by the AI categorization API, used in the review/import flow
export type CategorizedTransaction = {
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
};
