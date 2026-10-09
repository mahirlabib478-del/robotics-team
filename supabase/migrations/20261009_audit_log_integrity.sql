-- Keep audit attribution bound to the authenticated actor and make audit history append-only.
drop policy if exists admin_audit_insert on public.audit_logs;
create policy admin_audit_insert
  on public.audit_logs
  for insert
  to authenticated
  with check (
    (select private.has_any_role(array['super_admin','team_lead','technical_lead','media','hr_operations']::public.user_role[]))
    and actor_id = (select auth.uid())
  );

create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Audit logs are append-only'
    using errcode = '42501';
end;
$$;

drop trigger if exists audit_logs_append_only on public.audit_logs;
create trigger audit_logs_append_only
before update or delete on public.audit_logs
for each row execute function public.prevent_audit_log_mutation();

revoke all on function public.prevent_audit_log_mutation() from public, anon, authenticated;
