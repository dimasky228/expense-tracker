create table public.recurring (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount decimal(12,2) not null,
  currency text default 'USD',
  category text not null,
  frequency text not null default 'monthly' check (frequency in ('weekly', 'monthly', 'yearly')),
  next_date date,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now() not null
);

alter table public.recurring enable row level security;

create policy "Users can manage own recurring" on public.recurring
  for all using (auth.uid() = user_id);
