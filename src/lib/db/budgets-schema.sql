create table public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  amount decimal(12,2) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, category)
);

alter table public.budgets enable row level security;

create policy "Users can view own budgets"
  on public.budgets for select using (auth.uid() = user_id);

create policy "Users can insert own budgets"
  on public.budgets for insert with check (auth.uid() = user_id);

create policy "Users can update own budgets"
  on public.budgets for update using (auth.uid() = user_id);

create policy "Users can delete own budgets"
  on public.budgets for delete using (auth.uid() = user_id);
