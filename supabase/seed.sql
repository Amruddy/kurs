insert into organizations (id, name, type, status, timezone)
values
  ('00000000-0000-4000-8000-000000000001', 'Deshar', 'school', 'active', 'Europe/Moscow')
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  status = excluded.status,
  timezone = excluded.timezone,
  updated_at = now();

insert into users (id, name, email, phone, status)
values
  ('10000000-0000-4000-8000-000000000001', 'Администратор', 'admin@example.test', null, 'active'),
  ('10000000-0000-4000-8000-000000000002', 'Преподаватель', 'teacher@example.test', '+7 900 000-00-02', 'active'),
  ('10000000-0000-4000-8000-000000000003', 'Ученик', 'student@example.test', '+7 900 000-00-03', 'active'),
  ('10000000-0000-4000-8000-000000000004', 'Преподаватель-одиночка', 'solo-teacher@example.test', '+7 900 000-00-04', 'active')
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  phone = excluded.phone,
  status = excluded.status,
  updated_at = now();

insert into organization_members (id, organization_id, user_id, roles, permissions, status)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    array['admin','teacher','student'],
    array['admin:access','courses:write','groups:write','students:write','payments:write','materials:write'],
    'active'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    array['teacher'],
    array[]::text[],
    'active'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    array['student'],
    array[]::text[],
    'active'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000004',
    array['teacher','admin'],
    array['admin:access','courses:write','groups:write','students:write','payments:write','materials:write'],
    'active'
  )
on conflict (organization_id, user_id) do update set
  roles = excluded.roles,
  permissions = excluded.permissions,
  status = excluded.status,
  updated_at = now();

insert into courses (id, organization_id, name, description, type, format, lesson_mark_scale, status, created_by)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Таджвид: базовый курс',
    'Чтение, правила и практика для первой учебной группы.',
    'tajweed',
    'group',
    'five_point',
    'active',
    '10000000-0000-4000-8000-000000000001'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  type = excluded.type,
  format = excluded.format,
  lesson_mark_scale = excluded.lesson_mark_scale,
  status = excluded.status,
  updated_at = now();

insert into course_progress_settings (id, course_id, name, is_progress_enabled)
values
  ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Прогресс таджвида', true)
on conflict (course_id) do update set
  name = excluded.name,
  is_progress_enabled = excluded.is_progress_enabled,
  updated_at = now();

insert into students (id, organization_id, user_id, name, phone, email, status)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    'Ученик',
    '+7 900 000-00-03',
    'student@example.test',
    'active'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    null,
    'Амина Исмаилова',
    '+7 900 000-00-05',
    'amina@example.test',
    'active'
  )
on conflict (id) do update set
  user_id = excluded.user_id,
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  status = excluded.status,
  updated_at = now();

insert into groups (id, organization_id, course_id, teacher_id, name, status)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'Утренняя группа',
    'active'
  )
on conflict (id) do update set
  course_id = excluded.course_id,
  teacher_id = excluded.teacher_id,
  name = excluded.name,
  status = excluded.status,
  updated_at = now();

insert into group_students (id, group_id, student_id, status, joined_at)
values
  ('51000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'active', current_date),
  ('51000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', 'active', current_date)
on conflict (group_id, student_id) do update set
  status = excluded.status,
  joined_at = excluded.joined_at,
  updated_at = now();

insert into schedule_rules (
  id,
  organization_id,
  target_type,
  target_id,
  weekday,
  start_time,
  end_time,
  timezone,
  starts_on,
  ends_on,
  status
)
values
  (
    '60000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'group',
    '50000000-0000-4000-8000-000000000001',
    1,
    '10:00',
    '11:00',
    'Europe/Moscow',
    current_date,
    current_date + interval '90 days',
    'active'
  )
on conflict (id) do update set
  target_type = excluded.target_type,
  target_id = excluded.target_id,
  weekday = excluded.weekday,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  timezone = excluded.timezone,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  status = excluded.status,
  updated_at = now();

insert into lessons (
  id,
  organization_id,
  course_id,
  group_id,
  teacher_id,
  schedule_rule_id,
  scheduled_at,
  starts_at,
  ends_at,
  topic,
  summary
)
values
  (
    '70000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '60000000-0000-4000-8000-000000000001',
    current_date + 1,
    now() + interval '1 day',
    now() + interval '1 day' + interval '1 hour',
    'Повторение правил мадд',
    'Dev-занятие для проверки Supabase Foundation'
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    null,
    current_date + 3,
    now() + interval '3 days',
    now() + interval '3 days' + interval '1 hour',
    'Практика чтения',
    null
  )
on conflict (id) do update set
  scheduled_at = excluded.scheduled_at,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  topic = excluded.topic,
  summary = excluded.summary,
  updated_at = now();

insert into homework (id, organization_id, course_id, group_id, student_id, lesson_id, title, description, due_at, status, created_by)
values
  (
    '80000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    null,
    '70000000-0000-4000-8000-000000000001',
    'Повторить правило мадд',
    'Прочитать короткий отрывок и отметить сложные места.',
    now() + interval '7 days',
    'active',
    '10000000-0000-4000-8000-000000000002'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  due_at = excluded.due_at,
  status = excluded.status,
  updated_at = now();

insert into materials (id, organization_id, course_id, group_id, homework_id, title, type, content, url, visibility, status, created_by)
values
  (
    '81000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000001',
    'Памятка по мадд',
    'link',
    null,
    'https://example.test/tajweed-madd',
    'visible_to_students',
    'active',
    '10000000-0000-4000-8000-000000000002'
  )
on conflict (id) do update set
  title = excluded.title,
  type = excluded.type,
  content = excluded.content,
  url = excluded.url,
  visibility = excluded.visibility,
  status = excluded.status,
  updated_at = now();

insert into student_progress_rules (
  id,
  organization_id,
  student_id,
  course_id,
  name,
  level,
  note,
  is_visible_to_student,
  sort_order,
  is_active
)
values
  (
    '82000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Мадд',
    'good',
    'Повторить длинные гласные.',
    true,
    1,
    true
  )
on conflict (id) do update set
  name = excluded.name,
  level = excluded.level,
  note = excluded.note,
  is_visible_to_student = excluded.is_visible_to_student,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into payments (
  id,
  organization_id,
  student_id,
  course_id,
  group_id,
  amount,
  currency,
  period_type,
  period_start,
  period_end,
  due_at,
  status,
  comment,
  created_by,
  updated_by
)
values
  (
    '90000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    5000,
    'RUB',
    'month',
    date_trunc('month', current_date)::date,
    (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
    current_date + 7,
    'pending',
    'Dev-оплата ученика',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '90000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    5000,
    'RUB',
    'month',
    date_trunc('month', current_date)::date,
    (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
    current_date - 2,
    'pending',
    'Dev-просрочка для проверки списков',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001'
  )
on conflict (id) do update set
  amount = excluded.amount,
  currency = excluded.currency,
  period_type = excluded.period_type,
  period_start = excluded.period_start,
  period_end = excluded.period_end,
  due_at = excluded.due_at,
  status = excluded.status,
  comment = excluded.comment,
  updated_by = excluded.updated_by,
  updated_at = now();

