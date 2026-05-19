# План Stage 16. MPMF 1.0 Release Hardening

## 0. Статус

- Статус плана: завершен.
- Ветка: `feat/mpmf-1-stage-16-release-hardening`.
- Roadmap: `docs/roadmap/mpmf-1-implementation-roadmap.md`.
- Stage завершен, закоммичен и смержен в `main` через PR #46.
- Коммит stage: `9003ba3 Finalize MPMF 1.0 release hardening`.

## 1. Цель

Закрыть `MPMF 1.0` как цельную рабочую версию: пройти финальные проверки, сверить ключевые спецификации, проверить Supabase schema/seed, зафиксировать известные ограничения и подготовить проект к следующему большому блоку после MPMF 1.0.

## 2. Источники правды

Перед кодом прочитаны и используются:

- `docs/roadmap/README.md`;
- `docs/roadmap/mpmf-1-implementation-roadmap.md`;
- `docs/work-plans/active/README.md`;
- `docs/work-plans/completed/23-mpmf-1-stage-15-mobile-ux-polish-plan.md`;
- `docs/specs/README.md`;
- `docs/specs/00-global-spec.md`;
- `docs/specs/03-technical-specs/mpmf-1-scope.md`;
- `docs/specs/03-technical-specs/api-actions.md`;
- `docs/specs/03-technical-specs/data-model.md`.

## 3. Что входит

- Финальная сверка MPMF 1.0 по roadmap и спецификациям.
- Проверка `lint`, `build` и smoke по ролям.
- Проверка наличия Supabase schema/seed без применения SQL к production.
- Проверка, что dev-auth ограничения явно зафиксированы как часть MPMF 1.0.
- Документ с готовностью MPMF 1.0 и известными ограничениями.
- Обновление roadmap, active-plan, completed-plan и `AGENTS.md`.
- Подготовка перехода к следующему большому блоку: production auth и реальные аккаунты.

## 4. Что не входит

- Production auth.
- Настоящие email-приглашения, пароли и восстановление доступа.
- Онлайн-оплата.
- Новые продуктовые функции после MPMF 1.0.
- Production deploy и домен.
- Изменение Supabase данных без отдельной команды пользователя.

## 5. Технический план

1. Обновить roadmap, active-plan, completed-plan и `AGENTS.md` со Stage 15 на Stage 16.
2. Добавить финальную запись готовности MPMF 1.0 и известных ограничений.
3. Сверить, что ограничения dev-auth и отсутствие production auth уже описаны в спеках.
4. Проверить наличие `supabase/schema.sql` и `supabase/seed.sql`.
5. Запустить `npm.cmd run lint`, `npm.cmd run build` и `npm.cmd run smoke:roles`.
6. Выполнить локальную smoke-проверку доступности приложения.
7. Если найден блокер, исправить его в рамках Stage 16 и повторить проверки.

## 6. Проверка готовности

- `npm.cmd run lint` проходит успешно.
- `npm.cmd run build` проходит успешно.
- `npm.cmd run smoke:roles` проходит успешно против локального dev-сервера.
- `supabase/schema.sql` содержит SQL-схему MPMF 1.0.
- `supabase/seed.sql` содержит стабильные dev-данные и dev-пользователей.
- Финальная запись готовности MPMF 1.0 создана.
- Известные ограничения MPMF 1.0 зафиксированы.

## 7. Следующий этап после Stage 16

После merge Stage 16 `MPMF 1.0` считается завершенным. Следующий большой блок нужно начинать отдельным roadmap/work plan после обновления спецификаций. Первый кандидат: `Production Auth And Real Accounts`.
