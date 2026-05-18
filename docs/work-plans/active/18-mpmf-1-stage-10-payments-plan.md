# План Stage 10. Payments

## 0. Статус

- Статус плана: реализация и проверки завершены, ожидается подтверждение на commit/push.
- Ветка: `feat/mpmf-1-stage-10-payments`.
- Roadmap: `docs/roadmap/mpmf-1-implementation-roadmap.md`.
- Предыдущий завершенный stage: `MPMF 1.0 Stage 9. Student Learning Cabinet`, PR #39.

## 1. Цель

Закрыть ручной учет оплат для администратора и read-only просмотр оплат для преподавателя и ученика. Оплаты остаются внутренней учетной записью: без онлайн-эквайринга, чеков, автосписаний и автоматических уведомлений.

## 2. Источники правды

Перед кодом прочитаны и используются:

- `docs/roadmap/README.md`;
- `docs/roadmap/mpmf-1-implementation-roadmap.md`;
- `docs/work-plans/active/README.md`;
- `docs/work-plans/completed/17-mpmf-1-stage-9-student-learning-cabinet-plan.md`;
- `docs/specs/02-feature-specs/payments.md`;
- `docs/specs/02-feature-specs/student-cabinet.md`;
- `docs/specs/03-technical-specs/data-model.md`;
- `docs/specs/03-technical-specs/page-contracts.md`;
- `docs/specs/03-technical-specs/pages-and-routes.md`;
- `docs/specs/03-technical-specs/permissions.md`;
- `docs/specs/03-technical-specs/states-and-validation.md`;
- текущий data-layer и страницы `app/admin/payments`, `app/teacher/payments`, `app/student/payments`.

## 3. Что входит

- `/admin/payments`:
  - список оплат организации;
  - фильтры по ученику, группе, периоду и статусу;
  - сводка по статусам и оплатам, требующим внимания;
  - форма ручного создания оплаты;
  - ручная смена статуса оплаты;
  - запись истории изменения при смене статуса.
- `/teacher/payments`:
  - read-only список оплат учеников преподавателя;
  - сводка по оплатам, которые требуют внимания.
- `/student/payments`:
  - read-only список собственных оплат ученика;
  - сумма, срок, период, статус и открытый комментарий;
  - пустое состояние без фиктивного долга, если оплат нет.
- Сохранить уже добавленные платежные блоки в карточках группы и ученика.

## 4. Что не входит

- Онлайн-оплата.
- Интеграции с банками, платежными провайдерами и кассами.
- Автоматические уведомления.
- Автоматическая генерация долгов.
- Сложные тарифы, рассрочки и бухгалтерские отчеты.
- Редактирование оплат учеником.

## 5. Технический план

1. Обновить roadmap, active-plan и `AGENTS.md` со Stage 9 на Stage 10.
2. Расширить read-layer оплат полями периода, комментария и контекста обучения.
3. Добавить reader-функции для admin, teacher и student страниц оплат с учетом прав доступа.
4. Реализовать server actions для ручного создания оплаты и смены статуса администратором.
5. Заменить заглушки `/admin/payments`, `/teacher/payments`, `/student/payments` рабочими страницами.
6. Выполнить автоматические проверки и локальный smoke-check.

## 6. Проверка готовности

- Администратор открывает `/admin/payments`, видит список оплат, сводку, фильтры и форму создания.
- Администратор может создать оплату для ученика с корректным учебным контекстом.
- Администратор может поменять статус оплаты, а изменение записывается в `payment_history`.
- Преподаватель открывает `/teacher/payments` и видит только оплаты своих учеников без write-действий.
- Ученик открывает `/student/payments` и видит только свои оплаты без write-действий.
- Статус `pending` с прошедшим сроком подсвечивается как требующий внимания, но сохраненный статус не меняется автоматически.
- `npm.cmd run lint` проходит успешно.
- `npm.cmd run build` проходит успешно.
- Codex выполнил локальный smoke-check, если dev-сервер и Supabase доступны.

## 7. Ручной smoke-чеклист после автоматических проверок

- Войти как администратор и открыть `/admin/payments`.
- Проверить создание оплаты и смену статуса.
- Войти как преподаватель и открыть `/teacher/payments`: кнопок редактирования быть не должно.
- Войти как ученик и открыть `/student/payments`: видны только собственные оплаты.

## 8. Журнал выполнения

- Stage начат от актуального `main` после merge PR #39.
- Создана ветка `feat/mpmf-1-stage-10-payments`.
- План Stage 9 перенесен из `docs/work-plans/active/` в `docs/work-plans/completed/`.
- Обновлены active plan, roadmap и `AGENTS.md`.
- Расширен read-layer оплат в `app/lib/data/supabase-read.ts`: добавлены admin/teacher/student выборки, фильтры,
  сводные метрики, форматирование периода и визуальный сигнал для pending оплат с прошедшим сроком.
- Добавлен write-layer `app/lib/data/payment-write.ts`: ручное создание оплаты, валидация суммы, дат, статуса,
  учебного контекста и запись истории при создании и смене статуса.
- `/admin/payments` заменен с заглушки на рабочую страницу со сводкой, фильтрами, формой создания оплаты и ручной
  сменой статуса.
- `/teacher/payments` заменен с заглушки на read-only страницу оплат своих учеников.
- `/student/payments` заменен с заглушки на compact read-only страницу собственных оплат ученика.
- Добавлены CSS-правила для платежных ячеек, фильтров и статусных бейджей.
- Проверки пройдены: `git diff --check`, `npm.cmd run lint`, `npm.cmd run build`.
- Smoke-check выполнен на локальном dev-сервере:
  - `/admin/payments` под `admin@example.test` возвращает 200, показывает рабочую страницу оплат и не содержит старую заглушку;
  - `/teacher/payments` под `teacher@example.test` возвращает 200, показывает read-only страницу оплат и не содержит старую заглушку;
  - `/student/payments` под `student@example.test` возвращает 200, показывает compact страницу оплат и не содержит старую заглушку;
  - `/student/payments` под `teacher@example.test` перенаправляет на `/forbidden?required=student`.
