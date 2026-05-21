# План Auth Stage 3. Account Linking And Schema

## 0. Статус

- Статус плана: завершен, PR #50.
- Большой блок: `Release 1.0`.
- Подблок: `Production Auth And Real Accounts`.
- Планируемая ветка: `feat/auth-stage-3-account-linking-schema`.
- Коммит stage: `4ba9ceb`.
- Merge commit в `main`: `8898208`.
- Roadmap релиза: `docs/roadmap/release-1-roadmap.md`.
- Roadmap auth-блока: `docs/roadmap/production-auth-and-real-accounts-roadmap.md`.
- Предыдущий завершенный plan: `docs/work-plans/completed/27-auth-stage-2-supabase-auth-session-foundation-plan.md`.

## 1. Цель

Связать реального пользователя Supabase Auth с доменной таблицей `users` и сделать
session resolver зависимым от `users.auth_user_id`, активного профиля и активного
членства в организации.

Stage должен убрать временную production-связку только по email из stage 2, но не
должен смешиваться с массовыми приглашениями и отдельным admin UI для управления
доступом.

## 2. Источники правды

Перед кодом нужно читать:

- `docs/roadmap/README.md`;
- `docs/roadmap/release-1-roadmap.md`;
- `docs/roadmap/production-auth-and-real-accounts-roadmap.md`;
- `docs/specs/03-technical-specs/production-auth.md`;
- `docs/specs/03-technical-specs/api-actions.md`;
- `docs/specs/03-technical-specs/data-model.md`;
- `docs/specs/03-technical-specs/pages-and-routes.md`;
- `docs/specs/03-technical-specs/permissions.md`;
- `supabase/schema.sql`;
- `supabase/seed.sql`.

## 3. Что входит

- Добавить в Supabase schema поля:
  - `users.auth_user_id`;
  - `users.auth_status`;
  - `users.invited_at`;
  - `users.last_sign_in_at`.
- Добавить индексы/ограничения для поиска по `auth_user_id` и `auth_status`.
- Обновить seed/dev users под начальные auth-состояния без production-паролей.
- Обновить server session resolver:
  - читать подтвержденного Supabase Auth user;
  - искать доменный `users` профиль по `auth_user_id`;
  - при разрешенном переходном случае связать профиль по совпадающему email;
  - проверять активный `users.status`;
  - проверять активное `organization_members`;
  - выбирать рабочую область только из доступных ролей.
- Добавить понятные состояния отказа для случаев:
  - auth user есть, доменного профиля нет;
  - профиль есть, но отключен;
  - активного членства в организации нет.
- Сохранить dev-auth fallback только для локального dev-флага.
- Обновить `.env.example`, docs и SQL-инструкции, если потребуется.

## 4. Что не входит

- Массовые приглашения преподавателей и учеников.
- Admin UI для повторной отправки приглашений и отключения доступа.
- Public self-registration.
- OAuth, SSO, MFA, passkeys.
- Финальный UI/UX redesign.
- Production deploy.

## 5. Проверки

После реализации выполнить:

- `npm.cmd run lint`;
- `npm.cmd run build`;
- smoke `/login`;
- smoke protected redirect без cookie/session на `/login`;
- smoke dev-auth при `DESHAR_ENABLE_DEV_AUTH=1`;
- smoke, что dev-auth не работает без dev-флага;
- cross-role smoke для существующих dev-ролей;
- проверку `/profile` под реальным или dev session.

## 6. Ручная проверка перед commit/push

После автоматических проверок Codex должен дать пользователю конкретный маршрут:

- открыть `/login`;
- проверить вход или dev-вход;
- открыть `/profile`;
- открыть `/admin`, `/teacher` или `/student` согласно роли;
- проверить, что чужая рабочая область не открывается.

## 7. Следующий stage

После merge этого stage:

`Auth Stage 4. Admin Invitations`
