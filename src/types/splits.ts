export type Split = {
  id: string;
  user_id: string;
  transaction_id: string | null;
  total_amount: number;
  description: string;
  date: string;
  is_settled: boolean;
  created_at: string;
};

export type SplitParticipant = {
  id: string;
  split_id: string;
  name: string;
  amount: number;
  is_paid: boolean;
  created_at: string;
};

export type SplitWithParticipants = Split & { participants: SplitParticipant[] };
