# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать глобальную admin-панель (`/admin`) с дашбордом, управлением пользователями (роли + блокировка) и турнирами (статус + удаление).

**Architecture:** Server Components для всех страниц, Server Actions для мутаций. Доступ закрыт на уровне `app/admin/layout.tsx` — проверяет роль `admin` в профиле. Email пользователей получаем через service role client (`supabase.auth.admin.listUsers()`).

**Tech Stack:** Next.js 14 App Router, Supabase (SSR + service role), TypeScript, Tailwind CSS, Server Actions.

---

## Файловая карта

| Действие | Файл | Ответственность |
|---|---|---|
| Создать | `supabase/migrations/20260501000002_admin_role.sql` | Добавить роль admin, поле is_blocked, RLS, назначить первого admin |
| Изменить | `lib/supabase/types.ts` | Добавить `admin` в role union, поле `is_blocked` |
| Создать | `lib/supabase/admin-client.ts` | Service role client для admin-операций |
| Создать | `app/admin/layout.tsx` | Sidebar навигация + защита доступа |
| Создать | `app/admin/page.tsx` | Дашборд: счётчики + последние регистрации |
| Создать | `app/admin/users/page.tsx` | Список пользователей с поиском |
| Создать | `app/admin/users/actions.ts` | Server Actions: setUserRole, toggleBlock |
| Создать | `app/admin/tournaments/page.tsx` | Список всех турниров |
| Создать | `app/admin/tournaments/actions.ts` | Server Actions: setTournamentStatus, deleteTournament |
| Изменить | `app/profile/page.tsx` | Добавить ссылку «Админ-панель» для admin |

---

## Task 1: SQL-миграция

**Files:**
- Create: `supabase/migrations/20260501000002_admin_role.sql`

- [ ] **Создать файл миграции**

```sql
-- supabase/migrations/20260501000002_admin_role.sql

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

-- 6. Назначить первого администратора
update public.profiles set role = 'admin' where id = (
  select id from auth.users where email = 'ts9mail@gmail.com'
);
```

- [ ] **Применить миграцию в Supabase**

Временно переименовать `.env.local` → `.env.local.bak`, применить, вернуть:
```bash
# В папке billiard-app:
Rename-Item .env.local .env.local.bak
$env:SUPABASE_ACCESS_TOKEN="REDACTED"
npx supabase db push --linked
Rename-Item .env.local.bak .env.local
```

Ожидаемый вывод: `Applying migration 20260501000002_admin_role.sql... Finished supabase db push.`

- [ ] **Коммит**

```bash
git add supabase/migrations/20260501000002_admin_role.sql
git commit -m "feat: add admin role, is_blocked field and RLS policies"
```

---

## Task 2: Обновить TypeScript типы

**Files:**
- Modify: `lib/supabase/types.ts`

- [ ] **Добавить `admin` в role union и поле `is_blocked`**

В `lib/supabase/types.ts` найти блок `profiles` и заменить:

```typescript
// БЫЛО:
role: 'participant' | 'organizer'
// ...
// В Row, Insert, Update — везде где есть role

// СТАЛО:
role: 'participant' | 'organizer' | 'admin'
```

Также добавить `is_blocked` во все три секции (`Row`, `Insert`, `Update`):

```typescript
// Row:
is_blocked: boolean

// Insert:
is_blocked?: boolean

// Update:
is_blocked?: boolean
```

- [ ] **Проверить типы**

```bash
npx tsc --noEmit
```

Ожидаемый вывод: пустой (нет ошибок).

- [ ] **Коммит**

```bash
git add lib/supabase/types.ts
git commit -m "feat: add admin role and is_blocked to TypeScript types"
```

---

## Task 3: Service Role Client

**Files:**
- Create: `lib/supabase/admin-client.ts`

- [ ] **Создать helper для service role**

```typescript
// lib/supabase/admin-client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Коммит**

```bash
git add lib/supabase/admin-client.ts
git commit -m "feat: add admin supabase client helper"
```

---

## Task 4: Admin Layout

**Files:**
- Create: `app/admin/layout.tsx`

- [ ] **Создать layout с защитой и sidebar**

```typescript
// app/admin/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      <aside className="w-48 bg-slate-950 border-r border-slate-800 flex flex-col py-4 shrink-0">
        <div className="px-4 pb-4 border-b border-slate-800 mb-3">
          <div className="text-xs text-slate-500 uppercase tracking-widest">Admin</div>
          <div className="text-sm text-slate-400 mt-1">Виктория</div>
        </div>
        <nav className="flex flex-col gap-1 px-2 flex-1">
          <Link href="/admin" className="px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors">
            📊 Обзор
          </Link>
          <Link href="/admin/users" className="px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors">
            👥 Пользователи
          </Link>
          <Link href="/admin/tournaments" className="px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors">
            🏆 Турниры
          </Link>
        </nav>
        <div className="px-2 mt-auto pt-4 border-t border-slate-800">
          <Link href="/" className="px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-800 transition-colors block">
            ← На сайт
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8 max-w-5xl">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Коммит**

```bash
git add app/admin/layout.tsx
git commit -m "feat: add admin layout with sidebar and access guard"
```

---

## Task 5: Dashboard

**Files:**
- Create: `app/admin/page.tsx`

- [ ] **Создать страницу дашборда**

```typescript
// app/admin/page.tsx
import { createAdminClient } from '@/lib/supabase/admin-client'

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  const [
    { count: usersCount },
    { count: tournamentsCount },
    { count: registrationsCount },
    { data: recentRegs },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tournaments').select('*', { count: 'exact', head: true }),
    supabase.from('registrations').select('*', { count: 'exact', head: true }),
    supabase
      .from('registrations')
      .select('created_at, profiles(name), tournaments(title)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Обзор</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-green-400">{usersCount ?? 0}</div>
          <div className="text-sm text-slate-400 mt-1">Пользователей</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-blue-400">{tournamentsCount ?? 0}</div>
          <div className="text-sm text-slate-400 mt-1">Турниров</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-yellow-400">{registrationsCount ?? 0}</div>
          <div className="text-sm text-slate-400 mt-1">Регистраций</div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Последние регистрации</h2>
        <div className="flex flex-col gap-3">
          {(recentRegs ?? []).map((r, i) => {
            const profile = r.profiles as { name: string } | null
            const tournament = r.tournaments as { title: string } | null
            return (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-200">{profile?.name ?? '—'}</span>
                <span className="text-slate-500">{tournament?.title ?? '—'} · {new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
              </div>
            )
          })}
          {!recentRegs?.length && <p className="text-slate-500 text-sm">Нет регистраций</p>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Коммит**

```bash
git add app/admin/page.tsx
git commit -m "feat: add admin dashboard with stats"
```

---

## Task 6: Пользователи — Actions

**Files:**
- Create: `app/admin/users/actions.ts`

- [ ] **Создать Server Actions для управления пользователями**

```typescript
// app/admin/users/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return supabase
}

export async function setUserRole(userId: string, role: 'participant' | 'organizer' | 'admin') {
  const supabase = await assertAdmin()
  await supabase.from('profiles').update({ role }).eq('id', userId)
  revalidatePath('/admin/users')
}

export async function toggleBlock(userId: string, isBlocked: boolean) {
  const supabase = await assertAdmin()
  await supabase.from('profiles').update({ is_blocked: isBlocked }).eq('id', userId)
  revalidatePath('/admin/users')
}
```

- [ ] **Коммит**

```bash
git add app/admin/users/actions.ts
git commit -m "feat: add admin user management server actions"
```

---

## Task 7: Пользователи — Страница

**Files:**
- Create: `app/admin/users/page.tsx`

- [ ] **Создать страницу списка пользователей**

```typescript
// app/admin/users/page.tsx
import { createAdminClient } from '@/lib/supabase/admin-client'
import { setUserRole, toggleBlock } from './actions'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = createAdminClient()
  const q = searchParams.q?.toLowerCase() ?? ''

  // Получить email из auth.users
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 })

  // Получить профили
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, role, is_blocked, created_at')
    .order('created_at', { ascending: false })

  // Объединить
  const rows = (profiles ?? []).map(p => {
    const au = authUsers.find(u => u.id === p.id)
    return { ...p, email: au?.email ?? '' }
  }).filter(p =>
    !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
  )

  const ROLE_LABELS: Record<string, string> = {
    participant: 'участник',
    organizer: 'организатор',
    admin: 'admin',
  }

  const ROLE_COLORS: Record<string, string> = {
    participant: 'bg-blue-900 text-blue-300',
    organizer: 'bg-green-900 text-green-300',
    admin: 'bg-purple-900 text-purple-300',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <form>
          <input
            name="q"
            defaultValue={q}
            placeholder="Поиск по имени / email..."
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 w-64"
          />
        </form>
      </div>

      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-700">
            <tr className="text-slate-400 text-xs uppercase tracking-wide">
              <th className="text-left p-4">Имя</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Роль</th>
              <th className="text-left p-4">Дата</th>
              <th className="text-left p-4">Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(user => (
              <tr key={user.id} className="border-b border-slate-700 last:border-0">
                <td className="p-4 text-slate-200">{user.name}</td>
                <td className="p-4 text-slate-400">{user.email}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-md ${ROLE_COLORS[user.role] ?? ''}`}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="p-4 text-slate-500">
                  {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <form action={async (fd: FormData) => {
                      'use server'
                      await setUserRole(fd.get('userId') as string, fd.get('role') as 'participant' | 'organizer' | 'admin')
                    }}>
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        onChange="this.form.requestSubmit()"
                        className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white cursor-pointer"
                      >
                        <option value="participant">участник</option>
                        <option value="organizer">организатор</option>
                        <option value="admin">admin</option>
                      </select>
                      <button type="submit" className="sr-only">Применить</button>
                    </form>
                    <form action={async (fd: FormData) => {
                      'use server'
                      await toggleBlock(fd.get('userId') as string, fd.get('blocked') === 'true')
                    }}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="blocked" value={String(!user.is_blocked)} />
                      <button
                        type="submit"
                        className={`text-xs px-2 py-1 rounded ${user.is_blocked ? 'bg-slate-700 text-slate-300' : 'bg-red-900 text-red-300'}`}
                      >
                        {user.is_blocked ? 'Разблок' : 'Блок'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

> **Важно:** `onChange="this.form.requestSubmit()"` — это строковый атрибут (не JSX-обработчик), намеренно. Next.js сервер-компоненты не могут передавать inline-функции в HTML-атрибуты типа onChange. Вместо этого нужен клиентский компонент для автосмены роли. На первой итерации рядом будет кнопка «Применить», которую нажимает пользователь. Удали `onChange` и оставь `<button type="submit">`.

Итоговый вариант `select`:
```tsx
<select
  name="role"
  defaultValue={user.role}
  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white cursor-pointer"
>
  <option value="participant">участник</option>
  <option value="organizer">организатор</option>
  <option value="admin">admin</option>
</select>
<button type="submit" className="bg-slate-600 text-xs px-2 py-1 rounded text-white">✓</button>
```

- [ ] **Коммит**

```bash
git add app/admin/users/page.tsx
git commit -m "feat: add admin users list page"
```

---

## Task 8: Турниры — Actions

**Files:**
- Create: `app/admin/tournaments/actions.ts`

- [ ] **Создать Server Actions для управления турнирами**

```typescript
// app/admin/tournaments/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return supabase
}

export async function setTournamentStatus(
  tournamentId: string,
  status: 'draft' | 'open' | 'closed' | 'ongoing' | 'finished'
) {
  const supabase = await assertAdmin()
  await supabase.from('tournaments').update({ status }).eq('id', tournamentId)
  revalidatePath('/admin/tournaments')
}

export async function deleteTournament(tournamentId: string) {
  const supabase = await assertAdmin()
  await supabase.from('tournaments').delete().eq('id', tournamentId)
  revalidatePath('/admin/tournaments')
}
```

- [ ] **Коммит**

```bash
git add app/admin/tournaments/actions.ts
git commit -m "feat: add admin tournament management server actions"
```

---

## Task 9: Турниры — Страница

**Files:**
- Create: `app/admin/tournaments/page.tsx`

- [ ] **Создать страницу списка турниров**

```typescript
// app/admin/tournaments/page.tsx
import { createAdminClient } from '@/lib/supabase/admin-client'
import { setTournamentStatus, deleteTournament } from './actions'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  open: 'Открыт',
  closed: 'Закрыт',
  ongoing: 'Идёт',
  finished: 'Завершён',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-700 text-slate-300',
  open: 'bg-green-900 text-green-300',
  closed: 'bg-yellow-900 text-yellow-300',
  ongoing: 'bg-blue-900 text-blue-300',
  finished: 'bg-slate-700 text-slate-400',
}

export default async function AdminTournamentsPage() {
  const supabase = createAdminClient()

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select(`
      id, title, date, status,
      profiles!tournaments_organizer_id_fkey(name),
      registrations(count)
    `)
    .order('date', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Турниры</h1>

      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-700">
            <tr className="text-slate-400 text-xs uppercase tracking-wide">
              <th className="text-left p-4">Название</th>
              <th className="text-left p-4">Организатор</th>
              <th className="text-left p-4">Статус</th>
              <th className="text-left p-4">Участники</th>
              <th className="text-left p-4">Действия</th>
            </tr>
          </thead>
          <tbody>
            {(tournaments ?? []).map(t => {
              const organizer = t.profiles as { name: string } | null
              const regCount = (t.registrations as { count: number }[])[0]?.count ?? 0
              return (
                <tr key={t.id} className="border-b border-slate-700 last:border-0">
                  <td className="p-4 text-slate-200">{t.title}</td>
                  <td className="p-4 text-slate-400">{organizer?.name ?? '—'}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-md ${STATUS_COLORS[t.status] ?? ''}`}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{regCount}</td>
                  <td className="p-4">
                    <div className="flex gap-2 items-center">
                      <form action={async (fd: FormData) => {
                        'use server'
                        await setTournamentStatus(
                          fd.get('tournamentId') as string,
                          fd.get('status') as 'draft' | 'open' | 'closed' | 'ongoing' | 'finished'
                        )
                      }}>
                        <input type="hidden" name="tournamentId" value={t.id} />
                        <select
                          name="status"
                          defaultValue={t.status}
                          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white cursor-pointer"
                        >
                          <option value="draft">Черновик</option>
                          <option value="open">Открыт</option>
                          <option value="closed">Закрыт</option>
                          <option value="ongoing">Идёт</option>
                          <option value="finished">Завершён</option>
                        </select>
                        <button type="submit" className="bg-slate-600 text-xs px-2 py-1 rounded text-white ml-1">✓</button>
                      </form>
                      <form action={async (fd: FormData) => {
                        'use server'
                        await deleteTournament(fd.get('tournamentId') as string)
                      }}>
                        <input type="hidden" name="tournamentId" value={t.id} />
                        <button
                          type="submit"
                          className="bg-red-900 text-red-300 text-xs px-2 py-1 rounded"
                          onClick="return confirm('Удалить турнир?')"
                        >
                          Удалить
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Коммит**

```bash
git add app/admin/tournaments/page.tsx
git commit -m "feat: add admin tournaments list page"
```

---

## Task 10: Ссылка на AdminPanel в профиле

**Files:**
- Modify: `app/profile/page.tsx`

- [ ] **Добавить ссылку «Админ-панель» после заголовка, если роль admin**

В `app/profile/page.tsx` найти блок с заголовком:
```tsx
<div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-bold">{profile?.name ?? 'Профиль'}</h1>
  <Link href="/" className="text-gray-400 text-sm hover:text-white">← Главная</Link>
</div>
```

Заменить на:
```tsx
<div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-bold">{profile?.name ?? 'Профиль'}</h1>
  <div className="flex gap-3 items-center">
    {profile?.role === 'admin' && (
      <Link href="/admin" className="text-purple-400 text-sm hover:text-purple-300">
        Админ-панель
      </Link>
    )}
    <Link href="/" className="text-gray-400 text-sm hover:text-white">← Главная</Link>
  </div>
</div>
```

- [ ] **Коммит**

```bash
git add app/profile/page.tsx
git commit -m "feat: add admin panel link to profile page"
```

---

## Task 11: Финальная проверка

- [ ] **TypeScript**

```bash
npx tsc --noEmit
```

Ожидаемый вывод: пустой.

- [ ] **Сборка**

```bash
npx next build
```

Ожидаемый вывод: `✓ Compiled successfully` без ошибок. Новые маршруты `ƒ /admin`, `ƒ /admin/users`, `ƒ /admin/tournaments` появятся в списке.

- [ ] **Ручная проверка**

1. Открыть `/profile` → видна ссылка «Админ-панель»
2. Открыть `/admin` → дашборд с числами пользователей/турниров/регистраций
3. Открыть `/admin/users` → список пользователей с email, ролью, кнопками
4. Сменить роль у пользователя → страница обновляется, роль изменилась
5. Открыть `/admin/tournaments` → список всех турниров
6. Сменить статус турнира → обновляется
7. Открыть `/admin` в режиме инкогнито (не admin) → редирект на `/`
