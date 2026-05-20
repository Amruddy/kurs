# Supabase Dev Setup

Эта папка содержит чистую SQL-схему и seed-данные для dev-проекта Supabase.

Порядок применения в Supabase SQL Editor:

1. Выполнить `schema.sql`.
2. Выполнить `seed.sql`.
3. Заполнить локальный `.env.local` по `.env.example`.
4. Перезапустить `npm run dev`.

Секреты Supabase не записываются в эти файлы и не коммитятся.

## Диагностика медленных групп

Если страницы `/admin/groups` или `/teacher/groups` падают по таймауту Supabase,
выполнить в Supabase SQL Editor `repair-groups-performance.sql`.

Скрипт проверяет `public.groups`, показывает индексы, политики и блокировки,
создает недостающие индексы для групповых страниц и обновляет статистику
планировщика.

## Auth Stage 3

Для существующего Supabase-проекта перед проверкой реального входа выполнить в
Supabase SQL Editor `auth-stage-3-account-linking.sql`.

Скрипт добавляет `users.auth_user_id`, `users.auth_status`, `users.invited_at`,
`users.last_sign_in_at`, ограничения и индексы для связи Supabase Auth user с
доменным профилем Deshar.
