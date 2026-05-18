# План полного roadmap реализации MPMF 1.0

## 0. Статус

- Статус плана: проверки пройдены, ожидает команды на commit/push.
- Ветка: `docs/mpmf-1-implementation-roadmap`.
- Предыдущий завершенный stage: `MPMF 1.0 Spec Rewrite`, PR #27.

## 1. Цель

Зафиксировать полный порядок реализации версии `MPMF 1.0` до готового рабочего
проекта, чтобы дальше двигаться маленькими PR, а не одним большим изменением.

## 2. Что входит

- создать `docs/roadmap/mpmf-1-implementation-roadmap.md`;
- расписать stages до готовой версии 1.0;
- явно указать первый кодовый stage;
- обновить `docs/roadmap/README.md`;
- обновить `docs/work-plans/active/README.md`;
- обновить ссылку на активный технический план в `AGENTS.md`.

## 3. Что не входит

- реализация страниц;
- изменение Supabase schema;
- изменение seed-данных;
- изменение пользовательского интерфейса.

## 4. Проверка готовности

Stage считается готовым, если:

- roadmap покрывает группы, расписание, журнал, урок, ученика, платежи,
  материалы, домашние задания, прогресс, права и smoke;
- `docs/roadmap/README.md` указывает на полный roadmap;
- `docs/work-plans/active/README.md` указывает на этот план;
- `npm.cmd run lint` проходит успешно;
- `git diff --check` проходит успешно.

## 5. Запись о выполнении

Выполнено 2026-05-18:

- создан `docs/roadmap/mpmf-1-implementation-roadmap.md`;
- roadmap покрывает 15 stages до готовой версии 1.0;
- первым кодовым stage указан `Stage 1. Admin Group Detail`;
- `docs/roadmap/README.md` обновлен и указывает на этот planning stage;
- `docs/work-plans/active/README.md` указывает на этот активный план;
- `AGENTS.md` указывает на этот активный технический план;
- `git diff --check` - успешно;
- `npm.cmd run lint` - успешно.

Commit/push не выполнялись. Для закрытия stage нужна явная команда пользователя.
