-- Multi-account support & deduplication
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Add new columns to transactions
alter table public.transactions
  add column if not exists account             text,
  add column if not exists original_description text,
  add column if not exists import_hash         text;

-- 2. Indexes for deduplication lookups
create index if not exists transactions_import_hash_idx
  on public.transactions (import_hash)
  where import_hash is not null;

create index if not exists transactions_dedup_idx
  on public.transactions (user_id, date, amount);

create index if not exists transactions_account_idx
  on public.transactions (user_id, account)
  where account is not null;
