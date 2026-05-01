-- Делаем phone необязательным для email-авторизации
alter table public.profiles
  alter column phone drop not null;

alter table public.profiles
  drop constraint if exists profiles_phone_key;

-- Уникальность только по ненулевым номерам
create unique index profiles_phone_unique
  on public.profiles (phone)
  where phone is not null and phone != '';

-- Обновляем триггер: phone = null для email-пользователей
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone, name)
  values (
    new.id,
    nullif(new.phone, ''),
    coalesce(new.raw_user_meta_data->>'name', 'Участник')
  );
  return new;
end;
$$ language plpgsql security definer;
