# Supabase Foundation Plan

# План чистого подключения Supabase

## 0. Статус

- Статус плана: активный этап, в работе.
- Предыдущий этап `03-remove-legacy-database-layer-plan.md` смержен в `main`
  через PR #24.
- Codex перешел на `main`, обновил `main` из GitHub и создал stage-ветку от
  актуального `main`.

Текущая ветка:

```text
chore/supabase-foundation
```

## 1. Цель

Подключить проект к чистому Supabase-проекту без Prisma и без локальной базы
данных, чтобы страницы снова получали реальные данные из Supabase.

Архитектура этапа:

```text
Next.js app -> app/lib/supabase/* + app/lib/data/* -> Supabase
```

## 2. Предпосылки

- У пользователя создан Supabase project для разработки.
- В локальном `.env.local` добавлены Supabase-переменные.
- Полные секреты и ключи не коммитятся и не записываются в спеки.
- Старые локальные данные не переносятся.
- Prisma не возвращается.
- Локальная база данных не возвращается.

Ожидаемые локальные переменные:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Если Supabase-проект еще использует Legacy API Keys, вместо
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` можно указать `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

`SUPABASE_SERVICE_ROLE_KEY` используется только на сервере. Его нельзя
передавать в клиентские компоненты.

## 3. Что входит в этап

- добавить официальный Supabase JS client;
- создать серверный helper для Supabase в `app/lib/supabase/`;
- создать минимальную чистую схему Supabase для MVP-данных;
- добавить SQL-файл схемы в репозиторий без секретов;
- добавить seed-скрипт или seed SQL для dev-проекта Supabase;
- вернуть данные на базовые страницы:
  - `/login`;
  - `/admin`;
  - `/admin/courses`;
  - `/admin/groups`;
  - `/admin/students`;
  - `/teacher`;
  - `/teacher/groups`;
  - `/teacher/students`;
  - `/student`;
- оставить server actions минимальными: только то, что нужно для базовой
  ручной проверки;
- сохранить текущую русскую UI-копию.

## 4. Что не входит в этап

- Supabase Auth;
- RLS-политики;
- production-база с реальными данными;
- перенос старой локальной базы;
- восстановление всех форм и всех действий MVP сразу;
- сложный самописный ORM или Prisma-совместимый адаптер.

## 5. Технические правила

- Страницы не должны обращаться к Supabase напрямую, если запрос можно вынести в
  `app/lib/data/*`.
- Data layer должен состоять из явных функций под сценарии страниц, например:
  - `getAdminOverview`;
  - `getAdminCourses`;
  - `getTeacherOverview`;
  - `getStudentOverview`.
- Не создавать универсальный ORM-слой.
- SQL должен быть читаемым и проверяемым вручную.
- Любые операции записи должны быть серверными.
- Клиентские компоненты не получают service role key.

## 6. Проверка готовности

Этап считается готовым, если:

- `npm run build` проходит успешно;
- `npm run lint` проходит успешно;
- локально открывается `/login`;
- можно выбрать тестовую роль;
- базовые страницы admin/teacher/student открываются и показывают данные из
  Supabase dev-проекта;
- в проекте нет Prisma и локальной базы;
- секреты не попали в Git.

## 7. Порядок завершения ветки

1. Codex выполняет автоматические проверки.
2. Codex выполняет базовую локальную smoke-проверку.
3. Codex показывает пользователю, что проверено, и дает короткий ручной
   smoke-чеклист.
4. Пользователь явно разрешает продолжать.
5. Codex коммитит stage-ветку.
6. Codex пушит stage-ветку в GitHub.
7. Pull request открывает пользователь.
8. После merge пользователь сообщает Codex.
9. Codex возвращается на `main`, обновляет `main` из GitHub и только потом
   начинает следующий этап.

## 8. Запись о выполнении

Этап начат на ветке `chore/supabase-foundation`.

На старте этапа:

- Stage 1 уже смержен в `main`;
- `main` обновлен из GitHub;
- новая ветка создана от актуального `main`;
- секреты Supabase не записываются в репозиторий.

Выполнено локально:

- добавлена зависимость `@supabase/supabase-js`;
- добавлен серверный Supabase helper в `app/lib/supabase/`;
- добавлен явный data-layer в `app/lib/data/` без ORM и без Prisma;
- добавлены `supabase/schema.sql` и `supabase/seed.sql` для dev-проекта;
- `.env.example` обновлен под Supabase-переменные без значений;
- страницы `/admin`, `/admin/courses`, `/admin/groups`, `/admin/students`,
  `/teacher`, `/teacher/groups`, `/teacher/students`, `/student` переведены с
  временных пустых состояний на Supabase data-layer;
- если Supabase-переменные не настроены, страницы показывают понятное состояние
  настройки вместо падения.
- поддержаны оба имени публичного ключа Supabase:
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` и legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Проверено локально:

- `npm run lint` проходит успешно;
- `npm run build` проходит успешно;
- без Supabase credentials страницы показывают состояние настройки Supabase;
- с `.env.local` и примененными `supabase/schema.sql` + `supabase/seed.sql`
  smoke-проверка прошла:
  - `/login` возвращает 200;
  - `/admin` возвращает 200 и показывает данные админ-обзора;
  - `/admin/courses` возвращает 200 и показывает `Таджвид: базовый курс`;
  - `/admin/groups` возвращает 200 и показывает `Утренняя группа`;
  - `/admin/students` возвращает 200 и показывает seed-учеников;
  - `/teacher` возвращает 200 и показывает данные преподавателя;
  - `/teacher/groups` возвращает 200 и показывает `Утренняя группа`;
  - `/teacher/students` возвращает 200 и показывает учеников преподавателя;
  - `/student` возвращает 200 и показывает домашнее задание из Supabase.
- пользователь вручную проверил локальный интерфейс и подтвердил, что страницы
  работают нормально.

Осталось до закрытия этапа:

- Codex коммитит и пушит stage-ветку.

Следующий логичный этап после merge:

- `Admin CRUD foundation` - вернуть базовые server actions и формы для создания
  курса, группы, ученика и назначения ученика в группу.
