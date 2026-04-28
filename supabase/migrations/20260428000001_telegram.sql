-- telegram_chat_id в profiles
alter table public.profiles
  add column telegram_chat_id bigint unique;

-- одноразовые токены привязки
create table public.telegram_link_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique default gen_random_uuid()::text,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz default now()
);

alter table public.telegram_link_tokens enable row level security;
create policy "User manages own link tokens" on public.telegram_link_tokens
  for all using (auth.uid() = user_id);

-- добавить 'telegram' в channel constraint таблицы notifications
alter table public.notifications
  drop constraint if exists notifications_channel_check;
alter table public.notifications
  add constraint notifications_channel_check
  check (channel in ('push', 'sms', 'telegram'));
