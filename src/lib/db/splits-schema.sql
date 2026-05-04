create table public.splits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  transaction_id uuid references public.transactions(id) on delete set null,
  total_amount decimal(12,2) not null,
  description text not null,
  date date not null default current_date,
  is_settled boolean default false,
  created_at timestamptz default now() not null
);

create table public.split_participants (
  id uuid default gen_random_uuid() primary key,
  split_id uuid references public.splits(id) on delete cascade not null,
  name text not null,
  amount decimal(12,2) not null,
  is_paid boolean default false,
  created_at timestamptz default now() not null
);

alter table public.splits enable row level security;
alter table public.split_participants enable row level security;

create policy "Users can manage own splits" on public.splits
  for all using (auth.uid() = user_id);

create policy "Users can manage split participants" on public.split_participants
  for all using (
    exists (
      select 1 from public.splits
      where splits.id = split_participants.split_id
      and splits.user_id = auth.uid()
    )
  );
