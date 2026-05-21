# План Auth Stage 4. Admin Invitations

## 0. Статус

- Статус плана: завершен, PR #51.
- Большой блок: `Release 1.0`.
- Подблок: `Production Auth And Real Accounts`.
- Планируемая ветка: `feat/auth-stage-4-admin-invitations`.
- Коммит stage: `c40dfff`.
- Merge commit в `main`: `532d2ec`.
- Roadmap релиза: `docs/roadmap/release-1-roadmap.md`.
- Roadmap auth-блока: `docs/roadmap/production-auth-and-real-accounts-roadmap.md`.
- Предыдущий завершенный plan: `docs/work-plans/completed/28-auth-stage-3-account-linking-schema-plan.md`.

## 1. Цель

Дать администратору рабочее управление реальным auth-доступом преподавателей и
учеников из существующих админских разделов без отдельного общего экрана
пользователей.

Stage должен использовать Supabase Auth Admin API только на сервере, не создавать
production-пароли вручную и не удалять учебную историю при отключении доступа.

## 2. Источники правды

Перед кодом нужно читать:

- `docs/roadmap/README.md`;
- `docs/roadmap/release-1-roadmap.md`;
- `docs/roadmap/production-auth-and-real-accounts-roadmap.md`;
- `docs/specs/03-technical-specs/production-auth.md`;
- `docs/specs/03-technical-specs/api-actions.md`;
- `docs/specs/03-technical-specs/pages-and-routes.md`;
- `docs/specs/03-technical-specs/permissions.md`;
- official Supabase Auth Admin docs:
  - `https://supabase.com/docs/reference/javascript/admin-api`;
  - `https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail`;
  - `https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid`.

## 3. Что входит

- Добавить server actions для приглашения преподавателя по email.
- Добавить server actions для приглашения ученика по email.
- Для ученика при приглашении:
  - создать или использовать доменный `users` профиль;
  - создать или обновить `organization_members` с ролью `student`;
  - связать `students.user_id` с `users.id`.
- Вызвать Supabase Auth Admin API через server-only service-role client.
- Сохранять `users.auth_user_id`, `users.auth_status = 'invited'` и `users.invited_at`.
- Поддержать повторную отправку приглашения через тот же invite-flow.
- Добавить отключение доступа без удаления карточек, групп, уроков, прогресса,
  заданий, материалов и оплат.
- Показывать статус доступа в списках преподавателей и учеников, а также в
  карточке ученика.

## 4. Что не входит

- Public self-registration.
- OAuth, SSO, MFA, passkeys.
- Отдельный экран `/admin/users`.
- Ручная выдача production-пароля администратором.
- Массовые bulk-приглашения.
- Финальный UI/UX redesign.

## 5. Проверки

После реализации выполнить:

- `npm.cmd run lint`;
- `npm.cmd run build`;
- smoke `/admin/teachers`;
- smoke `/admin/students`;
- smoke `/admin/students/:studentId`;
- smoke, что кнопки приглашения и отключения доступны только в админской рабочей области;
- smoke, что отключенный `users.auth_status = 'disabled'` не проходит session resolver.

## 6. Ручная проверка перед commit/push

После автоматических проверок Codex должен дать пользователю конкретный маршрут:

- открыть `/admin/teachers`;
- проверить колонку доступа у преподавателей;
- нажать приглашение или повторную отправку для тестового преподавателя с email;
- открыть `/admin/students`;
- открыть карточку ученика с email;
- проверить блок доступа, приглашение и отключение доступа;
- убедиться, что учебные группы, оплаты и история ученика после отключения не удаляются.

## 7. Следующий stage

После merge этого stage:

`Auth Stage 5. Auth Smoke And Hardening`
