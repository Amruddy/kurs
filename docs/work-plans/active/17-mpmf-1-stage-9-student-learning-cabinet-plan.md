# План Stage 9. Student Learning Cabinet

## 0. Статус

- Статус плана: реализация и проверки завершены, ожидается подтверждение на commit/push.
- Ветка: `feat/mpmf-1-stage-9-student-learning-cabinet`.
- Roadmap: `docs/roadmap/mpmf-1-implementation-roadmap.md`.
- Предыдущий завершенный stage: `MPMF 1.0 Stage 8. Student Schedule And Dashboard`,
  PR #38.

## 1. Цель

Собрать учебный кабинет ученика в read-only режиме: ученик должен видеть свои домашние задания,
открытые материалы, открытый прогресс и посещаемость без действий редактирования.

## 2. Источники правды

Перед кодом прочитаны и используются:

- `docs/roadmap/README.md`;
- `docs/roadmap/mpmf-1-implementation-roadmap.md`;
- `docs/work-plans/active/README.md`;
- `docs/work-plans/completed/16-mpmf-1-stage-8-student-dashboard-schedule-plan.md`;
- `docs/specs/02-feature-specs/student-cabinet.md`;
- `docs/specs/03-technical-specs/page-contracts.md`;
- `docs/specs/03-technical-specs/pages-and-routes.md`;
- `docs/specs/03-technical-specs/data-model.md`;
- `docs/specs/03-technical-specs/permissions.md`;
- `docs/specs/03-technical-specs/states-and-validation.md`;
- текущие страницы и data-layer в `app/student` и `app/lib/data`.

## 3. Что входит

- Проверить, что `/student/homework`, `/student/materials` и `/student/progress` остаются
  рабочими read-only разделами в компактном student-дизайне.
- Реализовать `/student/attendance` вместо заглушки:
  - история занятий ученика по активным группам;
  - дата, время, курс, группа и тема занятия;
  - понятный статус посещаемости: присутствовал, отсутствовал, уважительная причина, не отмечено;
  - комментарии преподавателя только если они открыты ученику;
  - спокойное пустое состояние, если занятий или отметок пока нет.
- Сохранить ограничение доступа: ученик видит только свои данные.
- Не добавлять write-actions в кабинет ученика.

## 4. Что не входит

- Сдача домашних заданий учеником.
- Комментарии ученика и чат.
- Редактирование посещаемости учеником.
- Родительский кабинет.
- Онлайн-уведомления.

## 5. Технический план

1. Обновить roadmap, active-plan и `AGENTS.md` с Stage 8 на Stage 9.
2. Добавить в `app/lib/data/supabase-read.ts` типы и reader-функцию посещаемости ученика.
3. Заменить `/student/attendance` с заглушки на compact read-only страницу.
4. При необходимости добавить небольшие CSS-правила для статусов посещаемости.
5. Выполнить автоматические проверки и локальный smoke-check.

## 6. Проверка готовности

- Ученик открывает `/student/attendance` и видит только свою посещаемость.
- На странице есть компактные метрики и список занятий без таблицы и без действий редактирования.
- Статусы `present`, `absent`, `excused` отображаются понятными русскими подписями.
- Комментарий преподавателя показывается только при `is_visible_to_student = true`.
- Если данных нет, показывается пустое состояние без ошибки.
- `npm.cmd run lint` проходит успешно.
- `npm.cmd run build` проходит успешно.
- Codex выполнил локальный smoke-check, если dev-сервер и Supabase доступны.

## 7. Ручной smoke-чеклист после автоматических проверок

- Войти как ученик.
- Открыть `/student/attendance`.
- Проверить, что виден компактный список посещаемости.
- Проверить, что нет кнопок редактирования.
- Перейти в `/student/homework`, `/student/materials`, `/student/progress` и убедиться, что разделы
  остаются компактными и read-only.

## 8. Журнал выполнения

- Stage начат от актуального `main` после merge PR #38.
- Создана ветка `feat/mpmf-1-stage-9-student-learning-cabinet`.
- План Stage 8 перенесен из `docs/work-plans/active/` в `docs/work-plans/completed/`.
- Обновлены active plan, roadmap и `AGENTS.md`.
- Добавлена reader-функция `getStudentAttendance` в `app/lib/data/supabase-read.ts`: ученик видит
  занятия своих активных групп, статусы посещаемости и только открытые комментарии преподавателя.
- `/student/attendance` заменен с заглушки на compact read-only страницу с метриками, списком занятий
  и пустым состоянием.
- Добавлены компактные CSS-статусы посещаемости в существующий student-dashboard стиль.
- Проверки пройдены: `git diff --check`, `npm.cmd run lint`, `npm.cmd run build`.
- Smoke-check выполнен на локальном dev-сервере:
  - `/student/attendance` под `student@example.test` возвращает 200, показывает метрики и не содержит
    старую заглушку `Раздел готовится`;
  - `/student/homework`, `/student/materials`, `/student/progress` под учеником возвращают 200 и остаются
    в compact student-dashboard стиле;
  - `/student/attendance` под `teacher@example.test` перенаправляет на `/forbidden?required=student`.
- После ручного отзыва обновлен `/student/progress`: убраны отдельные заголовки вне карточек, пустые
  состояния оформлены compact-карточками.
- После дополнительного отзыва добавлено общее правило симметрии для student-блоков: соседние карточки
  в `student-dashboard-top`, `student-compact-grid` и `student-learning-grid` растягиваются до общей высоты,
  вложенные списки в парных колонках сохраняют ровную линию блоков.
- После уточнения по `/student/progress` парные разделы прогресса перестроены в прямые карточки одного
  grid-ряда: `Правила` и `Ошибки и замечания` теперь являются соседними видимыми блоками одинаковой
  высоты, без вложенных карточек разной высоты внутри колонок.
