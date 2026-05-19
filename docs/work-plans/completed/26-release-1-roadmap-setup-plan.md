# План Release 1.0 Roadmap Setup

## 0. Статус

- Статус плана: завершен после проверки и merge stage.
- Ветка: `feat/release-1-roadmap`.
- Большой блок: `Release 1.0`.
- Предыдущий завершенный plan: `docs/work-plans/completed/25-production-auth-real-accounts-plan.md`.
- Следующий активный plan: `docs/work-plans/active/27-auth-stage-2-supabase-auth-session-foundation-plan.md`.

## 1. Цель

Зафиксировать `Release 1.0` как верхний большой блок после `MPMF 1.0`, чтобы production auth, финальный дизайн, hardening и release candidate smoke были видны как части одной релизной версии.

## 2. Что входит

- Создание `docs/roadmap/release-1-roadmap.md`.
- Обновление общего `docs/roadmap/README.md`.
- Перенос `25-production-auth-real-accounts-plan.md` из active в completed.
- Создание active plan для `Auth Stage 2. Supabase Auth Session Foundation`.
- Фиксация решения: финальный UI/UX redesign входит в `Release 1.0` отдельным обязательным stage после production auth.
- Обновление ссылок в `AGENTS.md`, `docs/specs/README.md` и work-plans README.

## 3. Что не входит

- Runtime-код.
- Supabase Auth implementation.
- SQL-миграции.
- Изменение UI.

## 4. Проверки

Для этого документационного stage достаточно:

- `git diff --check`;
- проверка активных ссылок roadmap/work-plan;
- проверка отсутствия лишних trailing spaces в измененных docs.

## 5. Следующий stage

`Auth Stage 2. Supabase Auth Session Foundation`
