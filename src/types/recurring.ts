export type RecurringItem = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  category: string;
  frequency: "weekly" | "monthly" | "yearly";
  next_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};
