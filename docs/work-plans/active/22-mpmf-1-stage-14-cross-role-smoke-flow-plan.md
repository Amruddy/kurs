# План Stage 14. Cross-role Smoke Flow

## 0. Статус

- Статус плана: активная реализация.
- Ветка: `feat/mpmf-1-stage-14-cross-role-smoke-flow`.
- Roadmap: `docs/roadmap/mpmf-1-implementation-roadmap.md`.
- Предыдущий завершенный stage: `MPMF 1.0 Stage 13. Mass Payment Creation`, смержен в `main`.

## 1. Цель

Проверить основной путь MPMF 1.0 через роли администратора, преподавателя и ученика так, чтобы базовый smoke-сценарий можно было повторить локально без ручной работы в Supabase.

## 2. Источники правды

Перед кодом прочитаны и используются:

- `docs/roadmap/README.md`;
- `docs/roadmap/mpmf-1-implementation-roadmap.md`;
- `docs/work-plans/active/README.md`;
- `docs/work-plans/completed/21-mpmf-1-stage-13-mass-payment-creation-plan.md`;
- `docs/specs/README.md`;
- `docs/specs/03-technical-specs/mpmf-1-scope.md`;
- `docs/specs/03-technical-specs/pages-and-routes.md`;
- `docs/specs/03-technical-specs/page-contracts.md`;
- `docs/specs/03-technical-specs/api-actions.md`;
- `docs/specs/03-technical-specs/permissions.md`.

## 3. Что входит

- Команда автоматического smoke-check для основных маршрутов трех ролей.
- Проверка dev-auth cookie-сценария для администратора, преподавателя и ученика.
- Smoke-сценарий администратора: дашборд, курсы, группы, ученики, преподаватели и оплаты.
- Smoke-сценарий преподавателя: дашборд, группы, ученики, посещаемость, домашние задания, материалы и оплаты.
- Smoke-сценарий ученика: дашборд, расписание, домашние задания, материалы, прогресс, посещаемость и оплаты.
- Динамическая проверка карточек курса, группы, ученика, журнала и урока, если соответствующие ссылки есть в списках.
- Явная фиксация маршрутов, которые пропущены только из-за отсутствия dev-данных.
- Фиксация найденных блокеров и исправление только тех блокеров, которые мешают основному smoke-flow.

## 4. Что не входит

- Новые продуктовые функции.
- Переработка дизайна или mobile polish.
- Нагрузочное тестирование.
- Production monitoring.
- Замена dev-auth на production-auth.
- Ручное наполнение Supabase сверх уже подготовленных seed-данных.

## 5. Технический план

1. Обновить roadmap, active-plan, completed-plan и `AGENTS.md` со Stage 13 на Stage 14.
2. Добавить скрипт cross-role smoke-check без новых зависимостей.
3. Проверять маршруты с dev-auth cookies и падать при редиректе на `/login`, `/forbidden`, 404 или 5xx.
4. Динамически находить первые доступные карточки сущностей по ссылкам в списках и проверять их, если dev-данные есть.
5. Добавить npm-команду для повторяемого запуска smoke-check.
6. Запустить `lint`, `build` и cross-role smoke-check.
7. Если smoke найдет блокер в существующем коде, исправить его в рамках Stage 14 и повторить проверки.

## 6. Проверка готовности

- `npm.cmd run lint` проходит успешно.
- `npm.cmd run build` проходит успешно.
- Dev-сервер открывает приложение локально.
- `npm.cmd run smoke:roles` проходит успешно против локального dev-сервера.
- Админские маршруты не отправляют dev-админа на `/login` или `/forbidden`.
- Преподавательские маршруты не отправляют dev-преподавателя на `/login` или `/forbidden`.
- Ученические маршруты не отправляют dev-ученика на `/login` или `/forbidden`.
- Динамические карточки проверяются, если ссылки найдены в списках.
- Все пропуски динамических карточек явно выводятся в smoke-отчете.

## 7. Следующий этап после Stage 14

После merge Stage 14 следующим этапом должен идти `Stage 15. Mobile And UX Polish`.
