# Готовность Production Auth

## 1. Статус

Документ фиксирует состояние подплана `Production Auth And Real Accounts` в
рамках `Release 1.0`.

После `Auth Stage 5. Auth Smoke And Hardening` production-auth flow должен быть
проверен как цельный путь входа, доступа и выхода для администратора,
преподавателя и ученика.

## 2. Что покрывает auth-блок

- Email/password вход через Supabase Auth.
- Восстановление доступа через Supabase Auth.
- Logout с очисткой Supabase session и локальных cookies.
- Связь Supabase Auth user с доменным `users.auth_user_id`.
- Проверка `users.auth_status`, активного профиля и активного членства в
  `organization_members`.
- Приглашение преподавателей и учеников через Supabase Auth Admin API.
- Повторная отправка приглашения.
- Отключение auth-доступа без удаления учебной истории.
- Dev-auth только при явном локальном флаге `DESHAR_ENABLE_DEV_AUTH=1`.

## 3. Smoke-проверка

Auth smoke запускается командой:

```bash
npm.cmd run smoke:auth
```

Скрипт использует локальные `.env` / `.env.local`, service-role key и seed
профили:

- `admin@example.test`;
- `teacher@example.test`;
- `student@example.test`;
- `disabled-smoke@example.test`.

Smoke обновляет или создает соответствующие Supabase Auth аккаунты с временным
smoke-паролем, проверяет SSR cookies приложения и не предназначен для запуска на
production-проекте Supabase.

## 4. Оставшиеся ограничения Release 1.0

- Нет публичной самостоятельной регистрации.
- Нет OAuth, SSO, MFA и passkeys.
- Нет родительских аккаунтов.
- Нет массовых bulk-приглашений.
- Нет онлайн-оплаты и billing-интеграций.
- Нет production deploy, домена, backup-политики и мониторинга.
- Финальный UI/UX redesign выполняется отдельным stage после production auth.
