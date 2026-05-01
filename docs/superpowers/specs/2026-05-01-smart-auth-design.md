# Smart Auth Flow — Дизайн

**Дата:** 2026-05-01
**Проект:** billiard-app (Next.js + Supabase)

## Цель

Улучшить страницу входа: автоматически определять способ аутентификации пользователя (пароль или OTP) и показывать нужную форму без лишних шагов.

## Состояния страницы `/auth`

### 1. Пользователь уже залогинен
Показывается без формы входа:
- Аватар / иконка пользователя
- Текст «Вы уже вошли»
- Email текущего пользователя
- Кнопка «На главную →»
- Ссылка «Выйти из аккаунта»

### 2. Шаг 1 — ввод email
Начальное состояние для неавторизованных:
- Заголовок «Войти»
- Поле ввода email
- Кнопка «Далее →»

После нажатия «Далее» — запрос к `/api/auth/check-method`. Пока идёт запрос — кнопка в состоянии загрузки.

### 3. Пользователь с паролем
Показывается если `check-method` вернул `{ method: "password" }`:
- Email пользователя (readonly, над формой)
- Поле ввода пароля
- Кнопка «Войти»
- Ссылка «Войти через код →» (fallback на OTP, если забыл пароль)
- Ссылка «← Изменить email»

### 4. Новый пользователь или без пароля
Показывается если `check-method` вернул `{ method: "otp" }`. OTP отправляется автоматически при переходе на этот шаг:
- Текст «Код отправлен на {email}»
- Поле ввода OTP кода (6 символов, крупный шрифт)
- Кнопка «Подтвердить»
- Ссылка «← Изменить email»

## Компоненты

### `app/auth/page.tsx` (Server Component)
- Получает текущую сессию через `createClient()` (server)
- Если сессия есть → рендерит `AlreadyLoggedIn` с данными пользователя
- Если нет → рендерит `SmartAuthForm`

### `components/auth/SmartAuthForm.tsx` (Client Component)
Заменяет текущий `OtpForm.tsx`. Управляет состоянием:
```
type Step = 'email' | 'password' | 'otp'
```
- `email` → шаг 1
- `password` → шаг 3 (есть пароль)
- `otp` → шаг 4 (OTP)

### `components/auth/AlreadyLoggedIn.tsx` (Client Component)
Отображает шаг 1 (уже залогинен). Принимает `email: string`.

### `app/api/auth/check-method/route.ts`
```
POST { email: string }
→ 200 { method: "password" | "otp" }
```
Использует `supabase.auth.admin.listUsers()` + фильтрацию по email, проверяет наличие identity с провайдером `email` и установленным паролем (`has_password: true` или отсутствие в `identities`).

Доступен только серверу (использует `SUPABASE_SERVICE_ROLE_KEY`).

## Логика определения метода

Supabase не предоставляет прямого флага «есть пароль» через Admin API. Надёжный способ — кастомная RPC-функция, читающая `auth.users.encrypted_password`:

```sql
-- supabase/migrations/XXXXXX_check_password.sql
create or replace function public.user_has_password(user_email text)
returns boolean
language sql security definer
as $$
  select encrypted_password is not null and encrypted_password != ''
  from auth.users
  where email = user_email
  limit 1;
$$;
```

Логика API маршрута:
```
1. Вызвать RPC: supabase.rpc('user_has_password', { user_email: email })
2. Если RPC вернул null (пользователь не найден) → method: "otp" (новый)
3. Если RPC вернул false → method: "otp" (есть аккаунт, но без пароля)
4. Если RPC вернул true → method: "password"
```

## Переменные окружения

Добавить в `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=...
```
Получить из Supabase Dashboard → Project Settings → API → service_role key.

## Файлы к изменению / созданию

| Действие | Файл |
|---|---|
| Изменить | `app/auth/page.tsx` |
| Создать | `components/auth/SmartAuthForm.tsx` |
| Создать | `components/auth/AlreadyLoggedIn.tsx` |
| Удалить | `components/auth/OtpForm.tsx` (заменяется SmartAuthForm) |
| Создать | `app/api/auth/check-method/route.ts` |

## Вне скоупа

- Установка пароля в профиле (отдельная задача)
- Сброс пароля по email (отдельная задача)
- Социальные провайдеры (Google, GitHub)
