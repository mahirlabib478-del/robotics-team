-- Public form security hardening for existing deployments.
-- Apply after the base schema. Raw IP addresses are never stored.

create table if not exists public.public_submission_rate_limits (
  key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.public_submission_rate_limits enable row level security;

create or replace function public.check_public_submission_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  if p_key is null or length(p_key) < 16 or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.public_submission_rate_limits(key, window_started_at, request_count, updated_at)
  values (p_key, now(), 1, now())
  on conflict (key) do update
    set request_count = case
      when now() - public.public_submission_rate_limits.window_started_at >= make_interval(secs => p_window_seconds)
        then 1
      else public.public_submission_rate_limits.request_count + 1
    end,
    window_started_at = case
      when now() - public.public_submission_rate_limits.window_started_at >= make_interval(secs => p_window_seconds)
        then now()
      else public.public_submission_rate_limits.window_started_at
    end,
    updated_at = now()
  returning request_count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke all on table public.public_submission_rate_limits from public, anon, authenticated;
revoke all on function public.check_public_submission_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_public_submission_rate_limit(text, integer, integer) to service_role;
