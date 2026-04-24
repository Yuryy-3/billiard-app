-- Включить RLS
alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.registrations enable row level security;
alter table public.matches enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications enable row level security;

-- profiles: видят все, редактирует только владелец
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- tournaments: публичный просмотр; создание — авторизованные; редактирование — организатор
create policy "Tournaments are viewable by everyone"
  on public.tournaments for select using (true);

create policy "Authenticated users can create tournaments"
  on public.tournaments for insert with check (auth.uid() = organizer_id);

create policy "Organizer can update own tournament"
  on public.tournaments for update using (auth.uid() = organizer_id);

-- registrations: видит сам пользователь и организатор турнира
create policy "User sees own registrations"
  on public.registrations for select using (auth.uid() = user_id);

create policy "Organizer sees tournament registrations"
  on public.registrations for select using (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_id and t.organizer_id = auth.uid()
    )
  );

create policy "User can register"
  on public.registrations for insert with check (auth.uid() = user_id);

create policy "User can cancel registration"
  on public.registrations for delete using (auth.uid() = user_id);

-- matches: публичный просмотр; обновление — только организатор турнира
create policy "Matches are viewable by everyone"
  on public.matches for select using (true);

create policy "Organizer can insert matches"
  on public.matches for insert with check (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_id and t.organizer_id = auth.uid()
    )
  );

create policy "Organizer can update matches"
  on public.matches for update using (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_id and t.organizer_id = auth.uid()
    )
  );

-- push_subscriptions: только свои
create policy "User manages own push subscriptions"
  on public.push_subscriptions for all using (auth.uid() = user_id);

-- notifications: только свои
create policy "User sees own notifications"
  on public.notifications for select using (auth.uid() = user_id);

-- notifications: сервис может вставлять (через service role)
create policy "Service can insert notifications"
  on public.notifications for insert with check (true);
