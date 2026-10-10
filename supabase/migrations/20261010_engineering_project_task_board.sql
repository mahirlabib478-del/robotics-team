-- Private engineering project/task board. Keep unchecked for release until this migration
-- and role/RLS behavior have been verified against a clean Supabase staging project.
create table if not exists public.engineering_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  summary text not null default '',
  division text not null check (length(trim(division)) > 0),
  status text not null default 'planning' check (status in ('planning','active','paused','completed','archived')),
  owner_id uuid references public.profiles(id) on delete set null,
  due_date date,
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.engineering_project_members (
  project_id uuid not null references public.engineering_projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  capability text not null default 'viewer' check (capability in ('lead','editor','viewer')),
  added_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.engineering_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.engineering_projects(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  assignee_id uuid references public.profiles(id) on delete set null,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'todo' check (status in ('backlog','todo','in_progress','blocked','done')),
  due_date date,
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.engineering_task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.engineering_tasks(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in ('created','updated','status_changed')),
  from_status text,
  to_status text,
  created_at timestamptz not null default now()
);

create or replace function private.protect_engineering_project_creator()
returns trigger
language plpgsql
set search_path = ''
as $
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'Engineering project creator attribution is immutable' using errcode = '42501';
  end if;
  return new;
end;
$;
revoke all on function private.protect_engineering_project_creator() from public, anon, authenticated;

create or replace function private.protect_engineering_task_identity()
returns trigger
language plpgsql
set search_path = ''
as $
begin
  if new.project_id is distinct from old.project_id or new.created_by is distinct from old.created_by then
    raise exception 'Engineering task project and creator attribution are immutable' using errcode = '42501';
  end if;
  return new;
end;
$;
revoke all on function private.protect_engineering_task_identity() from public, anon, authenticated;

create or replace function private.protect_engineering_membership_identity()
returns trigger
language plpgsql
set search_path = ''
as $
begin
  if new.project_id is distinct from old.project_id
     or new.user_id is distinct from old.user_id
     or new.added_by is distinct from old.added_by then
    raise exception 'Engineering membership identity and attribution are immutable' using errcode = '42501';
  end if;
  return new;
end;
$;
revoke all on function private.protect_engineering_membership_identity() from public, anon, authenticated;

drop trigger if exists engineering_project_creator_immutable on public.engineering_projects;
create trigger engineering_project_creator_immutable before update on public.engineering_projects
for each row execute function private.protect_engineering_project_creator();
drop trigger if exists engineering_task_identity_immutable on public.engineering_tasks;
create trigger engineering_task_identity_immutable before update on public.engineering_tasks
for each row execute function private.protect_engineering_task_identity();
drop trigger if exists engineering_membership_identity_immutable on public.engineering_project_members;
create trigger engineering_membership_identity_immutable before update on public.engineering_project_members
for each row execute function private.protect_engineering_membership_identity();

create index if not exists engineering_projects_status_due_idx on public.engineering_projects(status, due_date);
create index if not exists engineering_project_members_user_idx on public.engineering_project_members(user_id, project_id);
create index if not exists engineering_tasks_project_status_idx on public.engineering_tasks(project_id, status, due_date);
create index if not exists engineering_tasks_assignee_idx on public.engineering_tasks(assignee_id, status);
create index if not exists engineering_task_events_task_created_idx on public.engineering_task_events(task_id, created_at desc);

create or replace function private.can_access_engineering_project(target_project_id uuid, minimum_capability text default 'viewer')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.has_any_role(array['super_admin']::public.user_role[])), false)
    or exists (
      select 1
      from public.engineering_project_members m
      where m.project_id = target_project_id
        and m.user_id = (select auth.uid())
        and case minimum_capability
          when 'lead' then m.capability = 'lead'
          when 'editor' then m.capability in ('lead','editor')
          else m.capability in ('lead','editor','viewer')
        end
    );
$$;
revoke all on function private.can_access_engineering_project(uuid, text) from public, anon;
grant execute on function private.can_access_engineering_project(uuid, text) to authenticated;

create or replace function private.add_engineering_project_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.engineering_project_members(project_id, user_id, capability, added_by)
  values (new.id, new.created_by, 'lead', new.created_by)
  on conflict (project_id, user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.add_engineering_project_creator() from public, anon, authenticated;

drop trigger if exists engineering_project_creator_membership on public.engineering_projects;
create trigger engineering_project_creator_membership
after insert on public.engineering_projects
for each row execute function private.add_engineering_project_creator();

create or replace function private.record_engineering_task_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.engineering_task_events(task_id, actor_id, event_type, to_status)
    values (new.id, (select auth.uid()), 'created', new.status);
    return new;
  end if;

  if (to_jsonb(new) - 'updated_at') is distinct from (to_jsonb(old) - 'updated_at') then
    insert into public.engineering_task_events(task_id, actor_id, event_type, from_status, to_status)
    values (
      new.id,
      (select auth.uid()),
      case when new.status is distinct from old.status then 'status_changed' else 'updated' end,
      old.status,
      new.status
    );
  end if;
  return new;
end;
$$;
revoke all on function private.record_engineering_task_event() from public, anon, authenticated;

drop trigger if exists engineering_task_event_on_change on public.engineering_tasks;
create trigger engineering_task_event_on_change
after insert or update on public.engineering_tasks
for each row execute function private.record_engineering_task_event();

create or replace function private.audit_engineering_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $
declare
  row_data jsonb;
  target_id uuid;
  target_type text;
  target_action text;
  details jsonb;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;

  if tg_table_name = 'engineering_projects' then
    target_type := 'engineering_project';
    target_id := (row_data ->> 'id')::uuid;
    target_action := lower(tg_op) || '_engineering_project';
    details := jsonb_build_object('slug', row_data ->> 'slug', 'division', row_data ->> 'division', 'status', row_data ->> 'status');
  elsif tg_table_name = 'engineering_project_members' then
    target_type := 'engineering_project';
    target_id := (row_data ->> 'project_id')::uuid;
    target_action := case tg_op when 'INSERT' then 'add_engineering_project_member' when 'UPDATE' then 'update_engineering_project_member' else 'remove_engineering_project_member' end;
    details := jsonb_build_object('member_id', row_data ->> 'user_id', 'capability', row_data ->> 'capability');
  else
    target_type := 'engineering_task';
    target_id := (row_data ->> 'id')::uuid;
    target_action := lower(tg_op) || '_engineering_task';
    details := jsonb_build_object('project_id', row_data ->> 'project_id', 'priority', row_data ->> 'priority', 'status', row_data ->> 'status', 'assignee_id', row_data ->> 'assignee_id');
  end if;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values ((select auth.uid()), target_action, target_type, target_id, details);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$;
revoke all on function private.audit_engineering_mutation() from public, anon, authenticated;

drop trigger if exists engineering_projects_audit on public.engineering_projects;
create trigger engineering_projects_audit after insert or update or delete on public.engineering_projects
for each row execute function private.audit_engineering_mutation();
drop trigger if exists engineering_project_members_audit on public.engineering_project_members;
create trigger engineering_project_members_audit after insert or update or delete on public.engineering_project_members
for each row execute function private.audit_engineering_mutation();
drop trigger if exists engineering_tasks_audit on public.engineering_tasks;
create trigger engineering_tasks_audit after insert or update or delete on public.engineering_tasks
for each row execute function private.audit_engineering_mutation();

drop trigger if exists engineering_projects_set_updated_at on public.engineering_projects;
create trigger engineering_projects_set_updated_at before update on public.engineering_projects
for each row execute function public.set_updated_at();
drop trigger if exists engineering_tasks_set_updated_at on public.engineering_tasks;
create trigger engineering_tasks_set_updated_at before update on public.engineering_tasks
for each row execute function public.set_updated_at();

alter table public.engineering_projects enable row level security;
alter table public.engineering_project_members enable row level security;
alter table public.engineering_tasks enable row level security;
alter table public.engineering_task_events enable row level security;

drop policy if exists engineering_projects_read on public.engineering_projects;
create policy engineering_projects_read on public.engineering_projects
for select to authenticated using ((select private.can_access_engineering_project(id, 'viewer')));
drop policy if exists engineering_projects_create on public.engineering_projects;
create policy engineering_projects_create on public.engineering_projects
for insert to authenticated with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and (select private.has_any_role(array['super_admin','team_lead']::public.user_role[]))
);
drop policy if exists engineering_projects_update on public.engineering_projects;
create policy engineering_projects_update on public.engineering_projects
for update to authenticated
using ((select private.can_access_engineering_project(id, 'lead')))
with check ((select private.can_access_engineering_project(id, 'lead')) and updated_by = (select auth.uid()));

drop policy if exists engineering_project_members_read on public.engineering_project_members;
create policy engineering_project_members_read on public.engineering_project_members
for select to authenticated using ((select private.can_access_engineering_project(project_id, 'viewer')));
drop policy if exists engineering_project_members_add on public.engineering_project_members;
create policy engineering_project_members_add on public.engineering_project_members
for insert to authenticated with check (
  user_id <> (select auth.uid())
  and added_by = (select auth.uid())
  and (select private.can_access_engineering_project(project_id, 'lead'))
);
drop policy if exists engineering_project_members_update on public.engineering_project_members;
create policy engineering_project_members_update on public.engineering_project_members
for update to authenticated
using ((select private.can_access_engineering_project(project_id, 'lead')) and user_id <> (select auth.uid()))
with check ((select private.can_access_engineering_project(project_id, 'lead')) and user_id <> (select auth.uid()));
drop policy if exists engineering_project_members_remove on public.engineering_project_members;
create policy engineering_project_members_remove on public.engineering_project_members
for delete to authenticated using ((select private.can_access_engineering_project(project_id, 'lead')) and user_id <> (select auth.uid()));

drop policy if exists engineering_tasks_read on public.engineering_tasks;
create policy engineering_tasks_read on public.engineering_tasks
for select to authenticated using ((select private.can_access_engineering_project(project_id, 'viewer')));
drop policy if exists engineering_tasks_create on public.engineering_tasks;
create policy engineering_tasks_create on public.engineering_tasks
for insert to authenticated with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and (select private.can_access_engineering_project(project_id, 'editor'))
  and (assignee_id is null or exists (
    select 1 from public.engineering_project_members m
    where m.project_id = engineering_tasks.project_id and m.user_id = engineering_tasks.assignee_id
  ))
);
drop policy if exists engineering_tasks_update on public.engineering_tasks;
create policy engineering_tasks_update on public.engineering_tasks
for update to authenticated
using ((select private.can_access_engineering_project(project_id, 'editor')))
with check (
  (select private.can_access_engineering_project(project_id, 'editor'))
  and updated_by = (select auth.uid())
  and (assignee_id is null or exists (
    select 1 from public.engineering_project_members m
    where m.project_id = engineering_tasks.project_id and m.user_id = engineering_tasks.assignee_id
  ))
);

drop policy if exists engineering_task_events_read on public.engineering_task_events;
create policy engineering_task_events_read on public.engineering_task_events
for select to authenticated using (
  exists (select 1 from public.engineering_tasks t
    where t.id = task_id and (select private.can_access_engineering_project(t.project_id, 'viewer')))
);

revoke all on public.engineering_projects, public.engineering_project_members, public.engineering_tasks, public.engineering_task_events from public, anon, authenticated;
grant select, insert, update on public.engineering_projects, public.engineering_tasks to authenticated;
grant select, insert, update, delete on public.engineering_project_members to authenticated;
grant select on public.engineering_task_events to authenticated;
