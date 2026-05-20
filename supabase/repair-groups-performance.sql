-- Диагностика и ремонт медленных запросов к public.groups в dev Supabase.
-- Запускать в Supabase SQL Editor для проекта, указанного в .env.local.
--
-- Скрипт не удаляет данные. Он проверяет состояние таблицы, создает недостающие
-- индексы для групповых страниц и обновляет статистику планировщика.

set statement_timeout = '30s';
set lock_timeout = '5s';

-- 1. Проверка, что таблица доступна и не отличается от ожидаемой public.groups.
select
  'public.groups' as table_name,
  c.reltuples::bigint as estimated_rows,
  c.relpages as estimated_pages,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'groups';

-- 2. Индексы и политики на groups.
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'groups'
order by indexname;

select policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'groups'
order by policyname;

-- 3. Блокировки. Если здесь есть долгие waiting/granted блокировки на groups,
-- сначала закройте зависшую операцию в Supabase Dashboard или SQL Editor.
select
  a.pid,
  a.state,
  a.wait_event_type,
  a.wait_event,
  l.mode,
  l.granted,
  now() - coalesce(a.xact_start, a.query_start) as age,
  left(a.query, 500) as query
from pg_locks l
join pg_stat_activity a on a.pid = l.pid
where l.relation = 'public.groups'::regclass
order by l.granted, age desc;

-- 4. Индексы, которые нужны страницам /admin/groups, /teacher/groups и деталям группы.
create index if not exists idx_groups_organization_id on public.groups(organization_id);
create index if not exists idx_groups_course_id on public.groups(course_id);
create index if not exists idx_groups_teacher_id on public.groups(teacher_id);
create index if not exists idx_group_students_group_id on public.group_students(group_id);
create index if not exists idx_group_students_student_id on public.group_students(student_id);
create index if not exists idx_lessons_group_starts_at on public.lessons(group_id, starts_at);
create index if not exists idx_schedule_rules_group_target
  on public.schedule_rules(organization_id, target_type, target_id, status);
create index if not exists idx_homework_group_id on public.homework(group_id);
create index if not exists idx_materials_group_id on public.materials(group_id);
create index if not exists idx_payments_group_id on public.payments(group_id);

-- 5. Обновление статистики после создания индексов.
analyze public.groups;
analyze public.group_students;
analyze public.lessons;
analyze public.schedule_rules;
analyze public.homework;
analyze public.materials;
analyze public.payments;

-- 6. Контроль: оба запроса должны выполняться быстро.
explain (analyze, buffers)
select id
from public.groups
limit 1;

explain (analyze, buffers)
select id, course_id, teacher_id, name, status
from public.groups
where organization_id = '00000000-0000-4000-8000-000000000001';
