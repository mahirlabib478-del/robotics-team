-- Read-only staging verification for the applied Supabase security boundary.
-- Run after applying all migrations. This reports PASS/FAIL rows and never mutates data.

with content_tables(table_name) as (
  values
    ('robots'), ('competitions'), ('team_members'),
    ('research_posts'), ('gallery_items'), ('sponsors')
),
checks as (
  select
    'RLS enabled: ' || t.table_name as check_name,
    coalesce((select c.relrowsecurity from pg_class c where c.oid = to_regclass('public.' || t.table_name)), false) as passed,
    'Enable row-level security on public.' || t.table_name as remediation
  from content_tables t

  union all
  select
    'Publishing trigger installed: ' || t.table_name,
    exists (
      select 1 from pg_trigger g
      where g.tgrelid = to_regclass('public.' || t.table_name)
        and g.tgname = t.table_name || '_publish_workflow_guard'
        and not g.tgisinternal
        and g.tgenabled <> 'D'
    ),
    'Apply the database publish-workflow guard migration for public.' || t.table_name
  from content_tables t

  union all
  select
    'Provenance columns exist: ' || t.table_name,
    exists (select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=t.table_name and c.column_name='created_by')
      and exists (select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=t.table_name and c.column_name='updated_by'),
    'Apply the content provenance migration and compare with supabase/schema.sql for public.' || t.table_name
  from content_tables t

  union all
  select
    'No duplicate provenance columns: ' || t.table_name,
    (select count(*) from information_schema.columns c where c.table_schema='public' and c.table_name=t.table_name and c.column_name in ('created_by','updated_by')) = 2,
    'Inspect the table definition for public.' || t.table_name
  from content_tables t

  union all
  select
    'Rate-limit table RLS enabled',
    coalesce((select c.relrowsecurity from pg_class c where c.oid=to_regclass('public.public_submission_rate_limits')), false),
    'Apply the public form security migration'

  union all
  select
    'Rate-limit table not directly accessible to client roles',
    to_regclass('public.public_submission_rate_limits') is not null
      and not has_table_privilege('anon','public.public_submission_rate_limits','SELECT')
      and not has_table_privilege('anon','public.public_submission_rate_limits','INSERT')
      and not has_table_privilege('anon','public.public_submission_rate_limits','UPDATE')
      and not has_table_privilege('anon','public.public_submission_rate_limits','DELETE')
      and not has_table_privilege('authenticated','public.public_submission_rate_limits','SELECT')
      and not has_table_privilege('authenticated','public.public_submission_rate_limits','INSERT')
      and not has_table_privilege('authenticated','public.public_submission_rate_limits','UPDATE')
      and not has_table_privilege('authenticated','public.public_submission_rate_limits','DELETE'),
    'Revoke direct grants from anon and authenticated on public.public_submission_rate_limits'

  union all
  select
    'Rate-limit RPC is SECURITY DEFINER with empty search_path',
    exists (
      select 1 from pg_proc p
      where p.oid=to_regprocedure('public.check_public_submission_rate_limit(text,integer,integer)')
        and p.prosecdef
        and coalesce(array_to_string(p.proconfig, ','),'') like '%search_path=""%'
    ),
    'Recreate the rate-limit RPC with SECURITY DEFINER and an empty search_path'

  union all
  select
    'Rate-limit RPC is executable by service_role',
    to_regprocedure('public.check_public_submission_rate_limit(text,integer,integer)') is not null
      and has_function_privilege('service_role','public.check_public_submission_rate_limit(text,integer,integer)','EXECUTE'),
    'Grant EXECUTE on the rate-limit RPC to service_role'

  union all
  select
    'Rate-limit RPC is not executable by client roles',
    to_regprocedure('public.check_public_submission_rate_limit(text,integer,integer)') is not null
      and not has_function_privilege('anon','public.check_public_submission_rate_limit(text,integer,integer)','EXECUTE')
      and not has_function_privilege('authenticated','public.check_public_submission_rate_limit(text,integer,integer)','EXECUTE'),
    'Revoke EXECUTE on the rate-limit RPC from PUBLIC, anon, and authenticated'

  union all
  select
    'updated-at trigger uses empty search_path',
    exists (
      select 1 from pg_proc p
      where p.oid=to_regprocedure('public.set_updated_at()')
        and coalesce(array_to_string(p.proconfig, ','),'') like '%search_path=""%'
    ),
    'Apply supabase/migrations/20261010_harden_updated_at_search_path.sql'

  union all
  select
    'updated-at trigger function not directly executable by client roles',
    to_regprocedure('public.set_updated_at()') is not null
      and not has_function_privilege('anon','public.set_updated_at()','EXECUTE')
      and not has_function_privilege('authenticated','public.set_updated_at()','EXECUTE'),
    'Revoke direct execution of public.set_updated_at() from client roles'

  union all
  select
    'Audit logs append-only trigger installed',
    (select count(*) from pg_trigger g where g.tgrelid=to_regclass('public.audit_logs') and g.tgname='audit_logs_append_only' and not g.tgisinternal) = 1,
    'Apply the audit log integrity migration'

  union all
  select
    'Audit insert policy binds actor to auth.uid()',
    exists (
      select 1 from pg_policies p
      where p.schemaname='public' and p.tablename='audit_logs' and p.policyname='admin_audit_insert'
        and lower(coalesce(p.with_check,'')) like '%auth.uid%'
    ),
    'Recreate admin_audit_insert so actor_id must equal auth.uid()'

  union all
  select
    'Audit mutation guard uses empty search_path and blocks direct execution',
    exists (
      select 1 from pg_proc p
      where p.oid=to_regprocedure('public.prevent_audit_log_mutation()')
        and coalesce(array_to_string(p.proconfig, ','),'') like '%search_path=""%'
    )
      and to_regprocedure('public.prevent_audit_log_mutation()') is not null
      and not has_function_privilege('anon','public.prevent_audit_log_mutation()','EXECUTE')
      and not has_function_privilege('authenticated','public.prevent_audit_log_mutation()','EXECUTE'),
    'Apply the audit integrity migration and revoke direct execution of the audit trigger function'

  union all
  select
    'Public form tables reject direct anonymous inserts',
    to_regclass('public.recruitment_applications') is not null
      and to_regclass('public.contact_messages') is not null
      and not has_table_privilege('anon','public.recruitment_applications','INSERT')
      and not has_table_privilege('anon','public.contact_messages','INSERT'),
    'Revoke direct INSERT grants from anon on recruitment_applications and contact_messages'

  union all
  select
    'Audit read policy is leadership-only',
    exists (
      select 1 from pg_policies p
      where p.schemaname='public' and p.tablename='audit_logs' and p.policyname='internal_audit_read'
        and lower(coalesce(p.qual,'')) like '%team_lead%'
        and lower(coalesce(p.qual,'')) like '%super_admin%'
    ),
    'Restrict internal_audit_read to team_lead and super_admin'

  union all
  select
    'Public form tables have RLS enabled',
    coalesce((select c.relrowsecurity from pg_class c where c.oid=to_regclass('public.recruitment_applications')),false)
      and coalesce((select c.relrowsecurity from pg_class c where c.oid=to_regclass('public.contact_messages')),false),
    'Enable RLS on recruitment_applications and contact_messages'
  union all
  select
    'Publishing guard is SECURITY INVOKER with empty search_path',
    exists (
      select 1 from pg_proc p
      where p.oid=to_regprocedure('public.enforce_content_publish_workflow()')
        and not p.prosecdef
        and coalesce(array_to_string(p.proconfig, ','),'') like '%search_path=""%'
    ),
    'Apply the database publish-workflow guard migration and preserve SECURITY INVOKER with an empty search_path'

  union all
  select
    'Publishing guard is not directly executable by client roles',
    to_regprocedure('public.enforce_content_publish_workflow()') is not null
      and not has_function_privilege('anon','public.enforce_content_publish_workflow()','EXECUTE')
      and not has_function_privilege('authenticated','public.enforce_content_publish_workflow()','EXECUTE'),
    'Revoke direct execution of public.enforce_content_publish_workflow() from PUBLIC, anon, and authenticated'

  union all
  select
    'Audit table RLS enabled',
    coalesce((select c.relrowsecurity from pg_class c where c.oid=to_regclass('public.audit_logs')),false),
    'Enable row-level security on public.audit_logs'

  union all
  select
    'Audit table denies direct client updates and deletes',
    to_regclass('public.audit_logs') is not null
      and not has_table_privilege('anon','public.audit_logs','UPDATE')
      and not has_table_privilege('anon','public.audit_logs','DELETE')
      and not has_table_privilege('authenticated','public.audit_logs','UPDATE')
      and not has_table_privilege('authenticated','public.audit_logs','DELETE'),
    'Revoke UPDATE and DELETE on public.audit_logs from anon and authenticated'

  union all
  select
    'Audit append-only trigger is enabled',
    exists (
      select 1 from pg_trigger g
      where g.tgrelid=to_regclass('public.audit_logs')
        and g.tgname='audit_logs_append_only'
        and not g.tgisinternal
        and g.tgenabled <> 'D'
    ),
    'Enable the audit_logs_append_only trigger after applying the audit integrity migration'

  union all
  select
    'updated-at trigger installed: ' || t.table_name,
    exists (
      select 1 from pg_trigger g
      where g.tgrelid=to_regclass('public.' || t.table_name)
        and g.tgname=t.table_name || '_set_updated_at'
        and not g.tgisinternal
        and g.tgenabled <> 'D'
    ),
    'Install or enable the ' || t.table_name || '_set_updated_at trigger'
  from (values ('profiles'),('robots'),('competitions'),('team_members'),('research_posts'),('sponsors'),('recruitment_settings')) as t(table_name)

)
select
  case when passed then 'PASS' else 'FAIL' end as result,
  check_name,
  remediation
from checks
order by passed asc, check_name asc;
