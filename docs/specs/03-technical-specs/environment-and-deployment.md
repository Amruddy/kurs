# Environment And Deployment

# Окружение и выкладка

## 1. Назначение документа

Этот документ фиксирует переменные окружения и правила выкладки для рабочего
использования Deshar.

Он не содержит реальные секреты. Значения ключей задаются локально в `.env` и
в Vercel Environment Variables.

## 2. Целевая выкладка

Рабочая выкладка проекта идет через Vercel.

Правила:

- GitHub-репозиторий подключается к Vercel;
- production и preview deployments создаются в Vercel;
- Supabase Auth redirect URLs должны включать production URL, preview URL при
  проверке и локальный адрес разработки;
- email-приглашения преподавателей и учеников должны вести на рабочий домен,
  а не на `localhost`.

## 3. Переменные для базы данных

### `DATABASE_URL`

Основная строка подключения Prisma к Supabase PostgreSQL.

Нужна:

- локальной разработке;
- Vercel runtime;
- seed и smoke-скриптам.

### `DIRECT_URL`

Прямая строка подключения для миграций, если она нужна выбранной схеме
Supabase/Vercel.

В приложении runtime не используется.

## 4. Переменные Supabase Auth

### `NEXT_PUBLIC_SUPABASE_URL`

Публичный URL Supabase project.

Можно использовать в browser и server code.

### `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Публичный Supabase publishable key.

Используется browser client, server client и proxy. Это предпочтительный ключ
для нового подключения.

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Legacy fallback для проектов, которые еще используют старый anon key.

Новый проект должен использовать `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### `SUPABASE_SECRET_KEY`

Секретный серверный ключ Supabase.

Используется только в server-only действиях: приглашения пользователей,
создание пользователей через admin API и другие административные действия.

Нельзя:

- импортировать в client components;
- выводить в UI;
- коммитить реальное значение;
- передавать в `NEXT_PUBLIC_*`.

### `SUPABASE_SERVICE_ROLE_KEY`

Legacy fallback для старого service role key.

Новый проект должен использовать `SUPABASE_SECRET_KEY`, если он доступен.

## 5. Переменные сайта

### `NEXT_PUBLIC_SITE_URL`

Публичный URL приложения.

Локально:

`http://localhost:3000`

В Vercel production:

основной домен проекта.

Эта переменная нужна для callback/redirect URL, писем-приглашений и ссылок из
рабочих email-сценариев.

## 6. Dev-auth

### `ENABLE_DEV_LOGIN`

Локальный флаг dev-входа через seed-пользователей.

В локальной разработке допустимо:

`ENABLE_DEV_LOGIN="true"`

В рабочем Vercel окружении должно быть:

`ENABLE_DEV_LOGIN="false"`

Dev-auth не является основным способом входа в рабочий продукт.

## 7. Минимальный Vercel checklist

Перед рабочей проверкой в Vercel должны быть заданы:

- `DATABASE_URL`;
- `DIRECT_URL`, если используется для миграций;
- `NEXT_PUBLIC_SITE_URL`;
- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
- `SUPABASE_SECRET_KEY`;
- `ENABLE_DEV_LOGIN="false"`.

Если используются legacy keys, временно можно задать:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY`.
