# Project Roadmap

# Дорожная карта Deshar

## 0. Назначение

Этот документ показывает текущий порядок этапов разработки и связывает между
собой стабильные спецификации продукта и рабочие планы.

Источники правды:

- продуктовые требования: `docs/specs/`;
- текущие и завершенные планы работ: `docs/work-plans/`;
- общий статус этапов: этот документ.

## 1. Текущий статус

- Текущая ветка: `chore/supabase-foundation`.
- Текущий этап: `Supabase Foundation`.
- Активный план этапа:
  `docs/work-plans/active/04-supabase-foundation-plan.md`.
- Статус этапа: Supabase Foundation реализован локально и проверен с dev-данными,
  ожидает ручной проверки пользователя и разрешения на commit/push.
- Предыдущий этап: `Remove Legacy Database Layer`, завершен и смержен в `main`.
- Запись предыдущего этапа:
  `docs/work-plans/completed/03-remove-legacy-database-layer-plan.md`.
- Следующий этап: будет уточнен после завершения `Supabase Foundation`.

## 2. Правило перехода между этапами

Новый этап нельзя начинать в ветке предыдущего этапа.

Порядок после завершения текущего этапа:

1. Codex показывает результаты проверок и короткий ручной smoke-чеклист.
2. Пользователь явно разрешает продолжать.
3. Codex коммитит текущую stage-ветку.
4. Codex пушит текущую stage-ветку в GitHub.
5. Pull request открывает пользователь.
6. После merge пользователь сообщает Codex, что PR смержен.
7. Codex сам переходит на `main`.
8. Codex сам обновляет `main` из GitHub.
9. Codex создает новую stage-ветку от актуального `main`.
10. Только после этого начинается следующий этап.

Пользователь не обязан отдельно писать Codex команду "перейди на main" после
merge. Сообщения о merge достаточно.

## 3. Ближайшие этапы

### Stage 1: Remove Legacy Database Layer

Цель:

- удалить старый Prisma/local database слой;
- не переносить старые данные;
- оставить приложение временно без runtime-базы;
- подготовить чистую точку перед Supabase.

План:

`docs/work-plans/completed/03-remove-legacy-database-layer-plan.md`

Статус:

этап завершен и смержен в `main` через PR #24.

### Stage 2: Supabase Foundation

Цель:

- подключить чистый Supabase-проект;
- добавить минимальную схему и seed для dev-данных;
- вернуть базовые страницы на реальные данные из Supabase;
- не возвращать Prisma и локальную базу.

План:

`docs/work-plans/active/04-supabase-foundation-plan.md`

Статус:

этап активен на ветке `chore/supabase-foundation`.

## 4. Правила для планов

- В `docs/specs/` хранятся стабильные требования продукта.
- В `docs/work-plans/active/` хранятся текущий активный план и ближайшие планы,
  которые еще нельзя начинать.
- В `docs/work-plans/completed/` нужно переносить завершенные планы и записи о
  фактическом результате после merge.
- Если roadmap и active README расходятся, сначала исправляется roadmap или
  active README, а код не пишется до устранения расхождения.

## 5. Запись о выполнении

Stage 1 завершен:

- ветка: `chore/remove-legacy-db-and-restructure-docs`;
- stage commit: `7ff5415`;
- merge commit в `main`: `ebf89a2`;
- PR: #24.

Stage 2 начат:

- ветка: `chore/supabase-foundation`;
- активный план: `docs/work-plans/active/04-supabase-foundation-plan.md`.
