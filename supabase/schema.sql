create extension if not exists pgcrypto;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'school',
  status text not null default 'active',
  timezone text not null default 'Europe/Moscow',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  user_id uuid not null references users(id) on delete restrict,
  roles text[] not null default '{}',
  permissions text[] not null default '{}',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  name text not null,
  description text,
  type text not null default 'tajweed',
  format text not null default 'group',
  lesson_mark_scale text not null default 'five_point',
  status text not null default 'active',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists course_progress_settings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete restrict,
  name text not null,
  is_progress_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id)
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  user_id uuid references users(id) on delete set null,
  name text not null,
  phone text,
  email text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists student_contacts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete restrict,
  name text not null,
  relation text,
  phone text,
  email text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  course_id uuid not null references courses(id) on delete restrict,
  teacher_id uuid references users(id) on delete set null,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists group_students (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  status text not null default 'active',
  joined_at date not null default current_date,
  left_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, student_id)
);

create table if not exists individual_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  course_id uuid not null references courses(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  teacher_id uuid not null references users(id) on delete restrict,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists schedule_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  target_type text not null,
  target_id uuid not null,
  weekday integer not null,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Europe/Moscow',
  starts_on date not null,
  ends_on date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  course_id uuid not null references courses(id) on delete restrict,
  group_id uuid references groups(id) on delete restrict,
  individual_enrollment_id uuid references individual_enrollments(id) on delete restrict,
  teacher_id uuid not null references users(id) on delete restrict,
  schedule_rule_id uuid references schedule_rules(id) on delete set null,
  scheduled_at date not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  topic text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, schedule_rule_id, starts_at)
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  attendance_mark text,
  lesson_mark text,
  teacher_comment text,
  internal_comment text,
  is_visible_to_student boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

create table if not exists progress_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  course_id uuid not null references courses(id) on delete restrict,
  lesson_id uuid references lessons(id) on delete set null,
  created_by uuid references users(id) on delete set null,
  repeat_note text,
  student_comment text,
  internal_comment text,
  is_visible_to_student boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists student_progress_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  course_id uuid not null references courses(id) on delete restrict,
  name text not null,
  level text,
  note text,
  is_visible_to_student boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists student_progress_errors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  course_id uuid not null references courses(id) on delete restrict,
  name text not null,
  note text,
  is_visible_to_student boolean not null default false,
  last_progress_record_id uuid references progress_records(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists homework (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  course_id uuid not null references courses(id) on delete restrict,
  group_id uuid references groups(id) on delete restrict,
  individual_enrollment_id uuid references individual_enrollments(id) on delete restrict,
  student_id uuid references students(id) on delete restrict,
  lesson_id uuid references lessons(id) on delete set null,
  title text not null,
  description text,
  due_at timestamptz,
  status text not null default 'active',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  course_id uuid references courses(id) on delete restrict,
  group_id uuid references groups(id) on delete restrict,
  individual_enrollment_id uuid references individual_enrollments(id) on delete restrict,
  student_id uuid references students(id) on delete restrict,
  lesson_id uuid references lessons(id) on delete set null,
  homework_id uuid references homework(id) on delete set null,
  title text not null,
  type text not null default 'text',
  content text,
  url text,
  visibility text not null default 'visible_to_students',
  status text not null default 'active',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  course_id uuid references courses(id) on delete restrict,
  group_id uuid references groups(id) on delete restrict,
  individual_enrollment_id uuid references individual_enrollments(id) on delete restrict,
  amount numeric(12,2) not null,
  currency text not null default 'RUB',
  period_type text not null default 'month',
  period_start date,
  period_end date,
  due_at date,
  status text not null default 'pending',
  comment text,
  internal_comment text,
  created_by uuid references users(id) on delete set null,
  updated_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payment_history (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete restrict,
  changed_by uuid references users(id) on delete set null,
  changed_at timestamptz not null default now(),
  field text not null,
  old_value text,
  new_value text,
  comment text
);

create index if not exists idx_courses_organization_id on courses(organization_id);
create index if not exists idx_groups_organization_id on groups(organization_id);
create index if not exists idx_groups_course_id on groups(course_id);
create index if not exists idx_groups_teacher_id on groups(teacher_id);
create index if not exists idx_group_students_group_id on group_students(group_id);
create index if not exists idx_group_students_student_id on group_students(student_id);
create index if not exists idx_students_organization_id on students(organization_id);
create index if not exists idx_lessons_organization_starts_at on lessons(organization_id, starts_at);
create index if not exists idx_lessons_group_starts_at on lessons(group_id, starts_at);
create index if not exists idx_schedule_rules_group_target on schedule_rules(organization_id, target_type, target_id, status);
create index if not exists idx_homework_group_id on homework(group_id);
create index if not exists idx_materials_group_id on materials(group_id);
create index if not exists idx_payments_group_id on payments(group_id);
create index if not exists idx_payments_organization_status on payments(organization_id, status);

