# Project Roadmap

# Дорожная карта Deshar

## 0. Назначение

Этот документ фиксирует текущий этап разработки и связывает стабильные
спецификации с рабочими планами.

Источники правды:

- спецификации продукта: `docs/specs/`;
- активный рабочий план: `docs/work-plans/active/`;
- завершенные планы: `docs/work-plans/completed/`.

## 1. Текущий статус

- Текущая ветка: `specs/mpmf-v1-rewrite`.
- Текущий этап: `MPMF 1.0 Spec Rewrite`.
- Активный план:
  `docs/work-plans/active/06-mpmf-1-spec-rewrite-plan.md`.
- Статус этапа: спецификации переписаны, проверки пройдены, ожидается команда на
  commit/push.
- Предыдущий этап: `Admin CRUD Foundation`, завершен и смержен в `main`.
- Запись предыдущего этапа:
  `docs/work-plans/completed/05-admin-crud-foundation-plan.md`.

## 2. Правило перехода между этапами

Новый stage нельзя реализовывать напрямую в `main`.

Цикл работы:

1. обновить `main`;
2. создать stage-ветку;
3. обновить spec;
4. обновить plan;
5. выполнить работу;
6. выполнить автоматические проверки;
7. выполнить базовую smoke-проверку, если применимо;
8. показать пользователю результат и короткий ручной чеклист;
9. после явного разрешения пользователя закоммитить и запушить ветку;
10. пользователь открывает и мержит pull request;
11. после сообщения о merge Codex сам возвращается на `main` и обновляет его.

## 3. Завершенные этапы

### Stage 1: Remove Legacy Database Layer

План:

`docs/work-plans/completed/03-remove-legacy-database-layer-plan.md`

Статус:

завершен и смержен в `main` через PR #24.

### Stage 2: Supabase Foundation

План:

`docs/work-plans/completed/04-supabase-foundation-plan.md`

Статус:

завершен и смержен в `main` через PR #25.

### Stage 3: Admin CRUD Foundation

План:

`docs/work-plans/completed/05-admin-crud-foundation-plan.md`

Статус:

завершен и смержен в `main` через PR #26.

## 4. Активный этап

### Stage 4: MPMF 1.0 Spec Rewrite

Цель:

- убрать старую терминологию;
- переписать основные спеки под `MPMF 1.0`;
- добавить page-by-page контракт;
- подготовить основу для реализации страниц версии 1.0.

План:

`docs/work-plans/active/06-mpmf-1-spec-rewrite-plan.md`

## 5. Следующий этап

Следующий stage выбирается после утверждения новых спецификаций.

Предварительный порядок реализации:

1. `/admin/groups/[groupId]` - карточка группы.
2. Расписание группы и создание занятий.
3. `/teacher/groups/[groupId]`.
4. `/teacher/groups/[groupId]/journal`.
5. `/teacher/lessons/[lessonId]`.
6. `/student/schedule`.
