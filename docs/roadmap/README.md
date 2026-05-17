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

- Текущая ветка: `feat/admin-crud-foundation`.
- Текущий этап: `Admin CRUD Foundation`.
- Активный план этапа:
  `docs/work-plans/active/05-admin-crud-foundation-plan.md`.
- Статус этапа: реализован локально, прошел автоматические проверки и ожидает
  ручной проверки создания записей через UI.
- Предыдущий этап: `Supabase Foundation`, завершен и смержен в `main`.
- Запись предыдущего этапа:
  `docs/work-plans/completed/04-supabase-foundation-plan.md`.
- Следующий этап: будет уточнен после завершения `Admin CRUD Foundation`.

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

`docs/work-plans/completed/04-supabase-foundation-plan.md`

Статус:

этап завершен и смержен в `main` через PR #25.

### Stage 3: Admin CRUD Foundation

Цель:

- вернуть базовые административные формы поверх Supabase;
- дать администратору создать курс, группу и ученика из интерфейса;
- дать администратору назначить ученика в группу;
- оставить остальные действия для следующих отдельных этапов.

План:

`docs/work-plans/active/05-admin-crud-foundation-plan.md`

Статус:

этап активен на ветке `feat/admin-crud-foundation`.

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

Stage 2 завершен:

- ветка: `chore/supabase-foundation`;
- stage commit: `c3216df`;
- merge commit в `main`: `188ed7b`;
- PR: #25.

Stage 3 начат:

- ветка: `feat/admin-crud-foundation`;
- активный план: `docs/work-plans/active/05-admin-crud-foundation-plan.md`.
