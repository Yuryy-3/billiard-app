# Глобальная Admin-панель — Дизайн

**Дата:** 2026-05-01
**Проект:** billiard-app (Next.js + Supabase)

## Цель

Создать защищённую панель `/admin` для управления всеми пользователями и турнирами сайта. Доступ — только пользователям с ролью `admin`.

---

## Изменения в БД

### 1. Расширение роли в `profiles`

Добавить `admin` в список допустимых значений поля `role`:

```sql
alter table public.profiles
  drop constraint profiles_role_check,
  add constraint profiles_role_check
    check (role in ('participant', 'organizer', 'admin'));
```

### 2. Поле `is_blocked`

Добавить флаг блокировки пользователя:

```sql
alter table public.profiles
  add column is_blocked boolean not null default false;
```

### 3. RLS — admin видит всё

```sql
-- profiles: admin может обновлять любой профиль
create policy "Admin can update any profile"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- tournaments: admin может удалять любой турнир
create policy "Admin can delete any tournament"
  on public.tournaments for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin can update any tournament"
  on public.tournaments for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
```

### 4. Назначить первого администратора

```sql
update public.profiles set role = 'admin' where id = (
  select id from auth.users where email = 'ts9mail@gmail.com'
);
```

---

## Маршруты

| Маршрут | Назначение |
|---|---|
| `/admin` | Dashboard: статистика (пользователи, турниры, регистрации, последние события) |
| `/admin/users` | Список всех пользователей, поиск, смена роли, блокировка |
| `/admin/tournaments` | Список всех турниров, смена статуса, удаление |

Все маршруты — Server Components. Действия — Server Actions.

---

## Файлы

### Layout

**`app/admin/layout.tsx`** (Server Component)
- Получает текущего пользователя через `createClient()`
- Если нет сессии → `redirect('/auth')`
- Если `profile.role !== 'admin'` → `redirect('/')`
- Рендерит боковую панель с навигацией + `{children}`

### Dashboard

**`app/admin/page.tsx`** (Server Component)
- Запрашивает: `count` из `profiles`, `tournaments`, `registrations`
- Последние 5 регистраций (с именем пользователя и турниром)
- Отображает 3 карточки статистики + таблицу последних событий

### Пользователи

**`app/admin/users/page.tsx`** (Server Component)
- Принимает `?q=` (поиск по имени/email) через `searchParams`
- Выбирает все `profiles` (id, name, email из `auth.users`, role, is_blocked, created_at)
- Для email — join через RPC или service role (email хранится в `auth.users`, не в `profiles`)

**Server Actions в `app/admin/users/actions.ts`:**
- `setUserRole(userId, role)` — обновляет `profiles.role`
- `toggleBlock(userId, isBlocked)` — обновляет `profiles.is_blocked`

### Турниры

**`app/admin/tournaments/page.tsx`** (Server Component)
- Список всех турниров: title, date, status, organizer name, registrations count
- Форма смены статуса (select), кнопка удаления с подтверждением

**Server Actions в `app/admin/tournaments/actions.ts`:**
- `setTournamentStatus(tournamentId, status)` — обновляет `tournaments.status`
- `deleteTournament(tournamentId)` — удаляет турнир (cascade удалит matches, registrations)

---

## Защита

- `app/admin/layout.tsx` блокирует доступ на уровне Server Component
- Middleware **не меняется** (проверка роли слишком тяжёлая для edge)
- Server Actions проверяют роль `admin` перед каждым изменением (defence in depth)

---

## Навигация с главной

- На странице профиля (`/profile`) добавить ссылку «Админ-панель» — видна только если `profile.role === 'admin'`

---

## Вне скоупа

- Логирование действий администратора
- Детальная страница пользователя
- Экспорт данных в CSV
- Управление матчами из admin-панели
