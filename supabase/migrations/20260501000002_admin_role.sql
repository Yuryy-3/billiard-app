-- 1. Расширить допустимые роли
alter table public.profiles
  drop constraint profiles_role_check,
  add constraint profiles_role_check
    check (role in ('participant', 'organizer', 'admin'));

-- 2. Добавить поле блокировки
alter table public.profiles
  add column if not exists is_blocked boolean not null default false;

-- 3. RLS: admin может обновлять любой профиль
create policy "Admin can update any profile"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 4. RLS: admin может обновлять любой турнир
create policy "Admin can update any tournament"
  on public.tournaments for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 5. RLS: admin может удалять любой турнир
create policy "Admin can delete any tournament"
  on public.tournaments for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 6. Назначить первого администратора (по email или по первому созданному пользователю)
update public.profiles set role = 'admin'
where id = (
  select id from auth.users where email = 'ts9mail@gmail.com'
  limit 1
);
