-- Расширение для UUID
create extension if not exists "uuid-ossp";

-- Профили пользователей (расширяет auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique not null,
  name text not null,
  photo_url text,
  city text not null default 'Не указан',
  role text not null default 'participant' check (role in ('participant', 'organizer')),
  created_at timestamptz default now()
);

-- Турниры
create table public.tournaments (
  id uuid primary key default uuid_generate_v4(),
  organizer_id uuid not null references public.profiles(id),
  title text not null,
  date timestamptz not null,
  address text not null,
  tables_count int not null default 4,
  discipline text not null check (discipline in ('svoyak', 'pyramid', 'combined')),
  participants_limit int not null check (participants_limit in (16, 32, 64)),
  wins_to_advance int not null default 2 check (wins_to_advance in (2, 3)),
  time_limit_min int not null default 60 check (time_limit_min in (45, 60, 90)),
  shot_clock_sec int not null default 40,
  shot_clock_extension_sec int not null default 20,
  entry_fee int not null default 0,
  payment_type text not null default 'free' check (payment_type in ('free', 'cash', 'online')),
  prize_description text,
  regulation_url text,
  status text not null default 'draft'
    check (status in ('draft', 'open', 'closed', 'ongoing', 'finished')),
  created_at timestamptz default now()
);

-- Регистрации
create table public.registrations (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'cash')),
  paid_at timestamptz,
  created_at timestamptz default now(),
  unique(tournament_id, user_id)
);

-- Матчи
create table public.matches (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round int not null,
  position int not null,
  player1_id uuid references public.profiles(id),
  player2_id uuid references public.profiles(id),
  score1 int not null default 0,
  score2 int not null default 0,
  winner_id uuid references public.profiles(id),
  table_number int,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now(),
  unique(tournament_id, round, position)
);

-- Push подписки
create table public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

-- Уведомления (лог)
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id),
  match_id uuid references public.matches(id),
  type text not null check (type in ('registration_confirmed', 'match_soon', 'table_assigned', 'match_result', 'tournament_finished')),
  channel text not null check (channel in ('push', 'sms')),
  sent_at timestamptz default now()
);

-- Триггер: автосоздание профиля при регистрации
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone, name)
  values (
    new.id,
    coalesce(new.phone, ''),
    coalesce(new.raw_user_meta_data->>'name', 'Участник')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
