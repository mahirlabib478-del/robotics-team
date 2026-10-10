-- Store explicitly approved public engineering explanations separately from private engineering notes.
-- Existing deployments may apply this migration before the application starts reading the new field.
alter table public.robots
  add column if not exists public_engineering jsonb not null default '{}'::jsonb;

alter table public.robots
  drop constraint if exists robots_public_engineering_object_check;

alter table public.robots
  add constraint robots_public_engineering_object_check
  check (jsonb_typeof(public_engineering) = 'object');

comment on column public.robots.public_engineering is
  'Allowlisted public-safe engineering explanations only; never copy private engineering JSON, source code, CAD details, firmware, costs, or competition-sensitive strategy.';
