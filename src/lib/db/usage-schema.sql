-- ============================================================
-- Run AFTER subscription-schema.sql
-- ============================================================

create table public.usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  month text not null, -- format: '2026-04'
  csv_imports integer default 0,
  unique(user_id, month)
);

alter table public.usage enable row level security;

create policy "Users can view own usage"
  on public.usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on public.usage for update
  using (auth.uid() = user_id);
