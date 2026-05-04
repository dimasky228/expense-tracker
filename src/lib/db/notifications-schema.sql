create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  metadata jsonb default '{}',
  created_at timestamptz default now() not null
);

alter table public.notifications enable row level security;

create policy "Users can manage own notifications" on public.notifications
  for all using (auth.uid() = user_id);

create index notifications_user_unread_idx on public.notifications(user_id, is_read);
create index notifications_created_idx on public.notifications(created_at desc);
