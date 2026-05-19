# Project Roadmap

# Дорожная карта Deshar

## 0. Назначение

Документ фиксирует текущий этап разработки и связывает стабильные спецификации с рабочими планами.

Источники правды:

- спецификации продукта: `docs/specs/`;
- активный рабочий план: `docs/work-plans/active/`;
- завершенные планы: `docs/work-plans/completed/`;
- полный roadmap реализации: `docs/roadmap/mpmf-1-implementation-roadmap.md`.

## 1. Текущий статус

- Текущая ветка: `feat/production-auth-real-accounts-plan`.
- Текущий этап: `Production Auth And Real Accounts. Specs And Foundation Plan`.
- Активный план: `docs/work-plans/active/25-production-auth-real-accounts-plan.md`.
- Статус: активная подготовка следующего блока.
- Предыдущий блок: `MPMF 1.0`, завершен и смержен в `main`.
- Запись завершения MPMF 1.0: `docs/release/mpmf-1-release-readiness.md`.

## 2. Правило перехода между этапами

Новый stage нельзя реализовывать напрямую в `main`.

Цикл работы:

1. обновить `main`;
2. создать stage-ветку;
3. обновить spec/plan при необходимости;
4. выполнить работу;
5. выполнить автоматические проверки;
6. выполнить базовую smoke-проверку, если применимо локально;
7. показать результат пользователю и короткий ручной чеклист;
8. после явного разрешения пользователя закоммитить и запушить ветку;
9. пользователь открывает и мержит pull request;
10. после merge Codex возвращается на `main` и обновляет его.

## 3. Завершенные этапы MPMF 1.0

- Stage 1: Admin Group Detail, PR #30.
- Stage 2: Group Schedule And Lessons, PR #31.
- Stage 3: Teacher Groups, PR #32.
- Stage 4: Calendar Journal, PR #33.
- Stage 5: Lesson Page, PR #34.
- Entry Page, PR #35.
- Stage 6: Tajweed Progress, PR #36.
- Stage 7: Homework And Materials, PR #37.
- Stage 8: Student Dashboard And Schedule, PR #38.
- Stage 9: Student Learning Cabinet, PR #39.
- Stage 10: Payments, PR #40.
- Stage 11: Admin Entity Completeness, PR #41.
- Stage 12: Access, Empty States And Errors.
- Stage 13: Mass Payment Creation, PR #43.
- Stage 14: Cross-role Smoke Flow, PR #44.
- Stage 15: Mobile And UX Polish, PR #45.
- Stage 16: MPMF 1.0 Release Hardening, PR #46.

## 4. Активный этап

### Production Auth And Real Accounts

План:

`docs/work-plans/active/25-production-auth-real-accounts-plan.md`

Roadmap:

`docs/roadmap/production-auth-and-real-accounts-roadmap.md`

Фокус:

- настоящая авторизация через Supabase Auth;
- email/password вход;
- приглашения преподавателей и учеников;
- связь auth-пользователя с `users`, ролями, организацией и карточкой ученика;
- dev-auth только как локальный инструмент разработки.

Статус:

активная реализация.

## 5. Следующий этап

Следующий stage после merge текущего stage:

`Auth Stage 2. Supabase Auth Session Foundation`

После него:

`Auth Stage 3. Account Linking And Schema`
