-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'free' check (status in ('free', 'pro', 'canceled', 'past_due')),
  current_period_end timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can manage subscriptions"
  on public.subscriptions for all
  using (true);

-- Auto-create a free subscription row when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, status)
  values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill existing users (safe to run multiple times)
insert into public.subscriptions (user_id, status)
select id, 'free' from auth.users
on conflict (user_id) do nothing;
