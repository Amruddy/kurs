# План Auth Stage 2. Supabase Auth Session Foundation

## 0. Статус

- Статус плана: активный следующий кодовый stage.
- Большой блок: `Release 1.0`.
- Подблок: `Production Auth And Real Accounts`.
- Планируемая ветка: `feat/auth-stage-2-supabase-session-foundation`.
- Roadmap релиза: `docs/roadmap/release-1-roadmap.md`.
- Roadmap auth-блока: `docs/roadmap/production-auth-and-real-accounts-roadmap.md`.
- Предыдущий завершенный plan: `docs/work-plans/completed/26-release-1-roadmap-setup-plan.md`.

## 1. Цель

Подключить основу настоящей Supabase Auth session к Next.js приложению: email/password вход, logout, callback, reset password и server-side session utilities.

Stage должен заменить production-путь dev-auth на реальную Supabase session, но не должен смешивать это с приглашениями и финальным redesign.

## 2. Источники правды

Перед кодом нужно прочитать:

- `docs/roadmap/README.md`;
- `docs/roadmap/release-1-roadmap.md`;
- `docs/roadmap/production-auth-and-real-accounts-roadmap.md`;
- `docs/specs/README.md`;
- `docs/specs/03-technical-specs/production-auth.md`;
- `docs/specs/03-technical-specs/api-actions.md`;
- `docs/specs/03-technical-specs/data-model.md`;
- `docs/specs/03-technical-specs/pages-and-routes.md`;
- `docs/specs/03-technical-specs/permissions.md`;
- official Supabase SSR/Auth docs:
  - `https://supabase.com/docs/guides/auth/server-side/creating-a-client`;
  - `https://supabase.com/docs/guides/auth/auth-email-password`;
  - `https://supabase.com/docs/guides/auth/passwords`;
  - `https://supabase.com/docs/reference/javascript/auth-signinwithpassword`;
  - `https://supabase.com/docs/reference/javascript/auth-signout`.

## 3. Что входит

- Проверить текущую реализацию dev-auth/session.
- Подключить `@supabase/ssr`, если зависимости еще нет.
- Создать server/client Supabase auth utilities для App Router.
- Добавить или обновить `/login`:
  - email/password вход;
  - восстановление пароля;
  - dev-кнопки только при явном dev-флаге.
- Добавить или обновить `/auth/callback`.
- Добавить или обновить `/auth/reset-password`.
- Добавить logout-действие или route handler.
- Подготовить protected route/session boundary для Server Components, Server Actions и Route Handlers.
- Сохранить dev-auth только как локальный fallback, недоступный в production.

## 4. Что не входит

- SQL-миграции `users.auth_user_id`, `users.auth_status`, `invited_at`, `last_sign_in_at`.
- Массовые приглашения преподавателей и учеников.
- Admin UI для приглашений.
- Финальный redesign интерфейса.
- Public self-registration.
- OAuth, SSO, MFA, passkeys.

## 5. Временное правило до Auth Stage 3

До stage `Account Linking And Schema` допускается промежуточный app-user resolver, который использует текущую доменную модель и email пользователя Supabase.

Полная связь через `users.auth_user_id` должна быть реализована только в следующем stage, чтобы не смешивать session foundation и schema linking.

## 6. Проверки

После реализации нужно выполнить:

- доступные lint/type/build проверки проекта;
- базовый smoke `/login`;
- smoke успешного logout;
- smoke redirect неавторизованного пользователя на `/login`;
- проверку, что dev-auth недоступен без dev-флага.

## 7. Следующий stage

После merge этого stage:

`Auth Stage 3. Account Linking And Schema`
