# Project Roadmap

# Дорожная карта Deshar

## 0. Назначение

Этот документ фиксирует текущий этап разработки и связывает стабильные
спецификации с рабочими планами.

Источники правды:

- спецификации продукта: `docs/specs/`;
- активный рабочий план, если он есть: `docs/work-plans/active/`;
- завершенные планы: `docs/work-plans/completed/`.

## 1. Текущий статус

- Текущая ветка: `feat/mpmf-1-stage-6-tajweed-progress`.
- Текущий этап: `MPMF 1.0 Stage 6. Tajweed Progress`.
- Активный план:
  `docs/work-plans/active/14-mpmf-1-stage-6-tajweed-progress-plan.md`.
- Статус: реализация проверена, ожидает подтверждения на commit/push.
- Предыдущий этап: `MPMF 1.0 Entry Page`, завершен и смержен
  в `main` через PR #35.
- Запись предыдущего этапа:
  `docs/work-plans/completed/13-mpmf-1-entry-page-plan.md`.

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

### Stage 4: MPMF 1.0 Spec Rewrite

План:

`docs/work-plans/completed/06-mpmf-1-spec-rewrite-plan.md`

Статус:

завершен и смержен в `main` через PR #27.

### Stage 5: MPMF 1.0 Implementation Roadmap

План:

`docs/work-plans/completed/07-mpmf-1-implementation-roadmap-plan.md`

Результат:

`docs/roadmap/mpmf-1-implementation-roadmap.md`

Статус:

завершен и смержен в `main` через PR #29.

### MPMF 1.0 Stage 1: Admin Group Detail

План:

`docs/work-plans/completed/08-mpmf-1-stage-1-admin-group-detail-plan.md`

Маршрут:

`/admin/groups/[groupId]`

Статус:

завершен и смержен в `main` через PR #30.

### MPMF 1.0 Stage 2: Group Schedule And Lessons

План:

`docs/work-plans/completed/09-mpmf-1-stage-2-group-schedule-lessons-plan.md`

Маршрут:

`/admin/groups/[groupId]`

Статус:

завершен и смержен в `main` через PR #31.

### MPMF 1.0 Stage 3: Teacher Groups

План:

`docs/work-plans/completed/10-mpmf-1-stage-3-teacher-groups-plan.md`

Маршруты:

- `/teacher/groups`;
- `/teacher/groups/[groupId]`.

Статус:

завершен и смержен в `main` через PR #32.

### MPMF 1.0 Stage 4: Calendar Journal

План:

`docs/work-plans/completed/11-mpmf-1-stage-4-calendar-journal-plan.md`

Маршруты:

- `/teacher/groups/[groupId]/journal`.

Статус:

завершен и смержен в `main` через PR #33.

### MPMF 1.0 Stage 5: Lesson Page

План:

`docs/work-plans/completed/12-mpmf-1-stage-5-lesson-page-plan.md`

Маршруты:

- `/teacher/lessons/[lessonId]`.

Статус:

завершен и смержен в `main` через PR #34.

### MPMF 1.0 Entry Page

План:

`docs/work-plans/completed/13-mpmf-1-entry-page-plan.md`

Маршруты:

- `/`;
- `/login`.

Статус:

завершен и смержен в `main` через PR #35.

## 4. Активный этап

### MPMF 1.0 Stage 6: Tajweed Progress

План:

`docs/work-plans/active/14-mpmf-1-stage-6-tajweed-progress-plan.md`

Маршруты:

- `/teacher/students/[studentId]`;
- `/student/progress`.

## 5. Следующий этап

Следующий stage после merge текущего stage:

`Stage 6. Tajweed Progress`

Полный roadmap реализации:

`docs/roadmap/mpmf-1-implementation-roadmap.md`
