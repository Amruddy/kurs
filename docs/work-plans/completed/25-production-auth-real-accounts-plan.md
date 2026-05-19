# План Production Auth And Real Accounts

## 0. Статус

- Статус плана: завершен и смержен.
- Ветка: `feat/production-auth-real-accounts-plan`.
- Commit: `6583548 Prepare production auth real accounts plan`.
- PR: `#47`.
- Merge commit: `0401543`.
- Roadmap: `docs/roadmap/production-auth-and-real-accounts-roadmap.md`.
- Предыдущий завершенный блок: `MPMF 1.0`, завершен через Stage 16 и смержен в `main`.

## 1. Цель

Открыть следующий блок после MPMF 1.0: настоящие аккаунты через Supabase Auth, вход по email/password, приглашения преподавателей и учеников, связь auth-пользователя с ролями, организацией и карточкой ученика.

## 2. Источники правды

Перед кодом прочитаны и используются:

- `docs/roadmap/README.md`;
- `docs/release/mpmf-1-release-readiness.md`;
- `docs/specs/README.md`;
- `docs/specs/00-global-spec.md`;
- `docs/specs/03-technical-specs/api-actions.md`;
- `docs/specs/03-technical-specs/data-model.md`;
- `docs/specs/03-technical-specs/pages-and-routes.md`;
- `docs/specs/03-technical-specs/permissions.md`;
- `docs/specs/03-technical-specs/production-auth.md`;
- Supabase official docs:
  - `https://supabase.com/docs/guides/auth/server-side/creating-a-client`;
  - `https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail`;
  - `https://supabase.com/docs/reference/javascript/auth-admin-createuser`.

## 3. Что входит в подготовительный stage

- Новый roadmap production-auth блока.
- Спецификация `production-auth.md`.
- Обновление существующих specs: global, data model, API actions, pages/routes.
- Перенос Stage 16 MPMF 1.0 в completed.
- Обновление активного плана и roadmap README.
- Список продуктовых решений перед кодом.

## 4. Что не входит в подготовительный stage

- Установка `@supabase/ssr`.
- Runtime-замена dev-auth.
- SQL-изменения schema.
- Настоящие приглашения email.
- Изменение страниц входа в коде.

## 5. Принятые решения

- Production auth строится на Supabase Auth.
- Основной вход: email + пароль.
- Публичной регистрации в первом этапе нет.
- Аккаунты создаются и приглашаются через административные действия.
- В production отправляются реальные email-приглашения через Supabase Auth invite flow.
- Приглашенный пользователь сам задает пароль из письма приглашения или восстановления.
- Администратор, преподаватель-одиночка и интерфейс продукта не задают и не показывают пароль пользователя.
- Простые временные пароли остаются только для dev/seed/smoke-режима.
- Управление auth-доступом первого этапа выполняется в админских карточках преподавателей и учеников, без обязательного отдельного `/admin/users`.
- Преподаватель-одиночка может приглашать и отключать доступ только в своей организации и для своих учеников.
- `users.id` остается внутренним доменным id.
- Supabase Auth id хранится отдельно в `users.auth_user_id`.
- Статус auth-доступа хранится в `users.auth_status`.
- Dev-auth может остаться только в dev-режиме через явный флаг окружения.
- Service role key используется только на сервере.

## 6. Вопросы перед кодом

Открытых продуктовых вопросов для первого кода нет.

Первый production-auth stage работает в текущей модели одной активной организации, как MPMF 1.0. Модель при этом сохраняет `organization_members`, чтобы позже добавить полноценный выбор организации без переписывания auth-связи.

## 7. Следующий stage

После merge подготовительного stage следующим идет:

`Auth Stage 2. Supabase Auth Session Foundation`
