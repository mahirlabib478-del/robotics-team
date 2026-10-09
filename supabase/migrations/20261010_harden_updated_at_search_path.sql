-- Harden the updated-at trigger for existing deployments without editing applied migration history.
-- This trigger only uses built-in functions and row fields, so it does not need a writable schema search path.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
