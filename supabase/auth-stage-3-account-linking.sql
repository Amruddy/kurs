-- Auth Stage 3. Account Linking And Schema.
-- Запускать в Supabase SQL Editor для существующего dev/production-like проекта
-- перед smoke-проверкой реального входа через Supabase Auth.

set statement_timeout = '30s';
set lock_timeout = '5s';

alter table public.users add column if not exists auth_user_id uuid;
alter table public.users add column if not exists auth_status text not null default 'profile_only';
alter table public.users add column if not exists invited_at timestamptz;
alter table public.users add column if not exists last_sign_in_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_auth_status_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users add constraint users_auth_status_check
      check (auth_status in ('profile_only', 'invited', 'active', 'disabled'));
  end if;
end $$;

create unique index if not exists idx_users_auth_user_id
  on public.users(auth_user_id)
  where auth_user_id is not null;

create index if not exists idx_users_auth_status
  on public.users(auth_status);

update public.users
set auth_status = 'profile_only'
where auth_status is null;

analyze public.users;

select
  id,
  email,
  auth_user_id,
  auth_status,
  invited_at,
  last_sign_in_at
from public.users
order by email;
