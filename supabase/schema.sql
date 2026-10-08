create extension if not exists pgcrypto;

create type public.user_role as enum ('super_admin','team_lead','technical_lead','media','hr_operations','viewer');
create type public.publish_status as enum ('draft','review','published','archived');
create type public.visibility as enum ('public','internal');
create type public.competition_level as enum ('National','International');
create type public.achievement_result as enum ('Champion','Runner-up','Podium','Finalist','Participation');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.user_role not null default 'viewer',
  university_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.robots (
  id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, category text not null,
  version text not null, weight_kg numeric, dimensions text, status text not null, development_year integer not null,
  summary text not null, specifications jsonb not null default '{}'::jsonb, engineering jsonb not null default '{}'::jsonb,
  sensitive_fields_hidden text[] not null default '{}', publish_status public.publish_status not null default 'draft',
  visibility public.visibility not null default 'public', created_by uuid references public.profiles(id), updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.robot_media (
  id uuid primary key default gen_random_uuid(), robot_id uuid not null references public.robots(id) on delete cascade,
  media_type text not null check (media_type in ('image','video','cad')), source_url text not null, alt_text text not null,
  caption text, sort_order integer not null default 0, visibility public.visibility not null default 'public'
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(), slug text unique not null, official_name text not null, organizer text not null,
  event_date date, year integer not null, city text, country text, level public.competition_level not null, segment text not null,
  robot_name text not null, result public.achievement_result not null, team_members text[] not null default '{}', report text,
  publish_status public.publish_status not null default 'draft', visibility public.visibility not null default 'public',
  created_by uuid references public.profiles(id), updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.competition_evidence (
  id uuid primary key default gen_random_uuid(), competition_id uuid not null references public.competitions(id) on delete cascade,
  label text not null, href text not null, evidence_type text, created_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, role text not null, division text not null,
  department text, semester text, skills text[] not null default '{}', projects text[] not null default '{}', tenure text not null,
  alumni boolean not null default false, photo_url text, public_links jsonb not null default '[]'::jsonb,
  publish_status public.publish_status not null default 'draft', visibility public.visibility not null default 'public',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.research_posts (
  id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, excerpt text not null, body text not null,
  category text not null, author_name text, publish_status public.publish_status not null default 'draft',
  visibility public.visibility not null default 'public', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(), title text not null, category text not null,
  source_type text not null check (source_type in ('image','youtube')), source_url text not null, thumbnail_url text, alt_text text not null,
  caption text, publish_status public.publish_status not null default 'draft', visibility public.visibility not null default 'public',
  created_at timestamptz not null default now()
);

create table public.sponsors (
  id uuid primary key default gen_random_uuid(), name text not null, logo_url text, website_url text, partnership_type text, description text,
  publish_status public.publish_status not null default 'draft', visibility public.visibility not null default 'public',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.recruitment_settings (
  id boolean primary key default true, applications_open boolean not null default false, stage text not null default 'Applications Closed',
  deadline timestamptz, description text, updated_at timestamptz not null default now()
);

create table public.recruitment_applications (
  id uuid primary key default gen_random_uuid(), name text not null, department text not null, semester text not null, student_id text not null,
  preferred_division text not null, skills text, previous_projects text, github_or_portfolio text, weekly_availability text, why_join text not null,
  status text not null default 'Submitted', submitted_at timestamptz not null default now(), reviewed_by uuid references public.profiles(id), reviewed_at timestamptz
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(), name text not null, email text not null, organization text, subject text not null,
  message text not null, status text not null default 'New', created_at timestamptz not null default now(),
  handled_by uuid references public.profiles(id), handled_at timestamptz
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id), action text not null, entity_type text not null,
  entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create index robots_publish_idx on public.robots (publish_status, visibility);
create index competitions_publish_idx on public.competitions (publish_status, visibility);
create index team_members_publish_idx on public.team_members (publish_status, visibility);
create index research_posts_publish_idx on public.research_posts (publish_status, visibility);
create index gallery_items_publish_idx on public.gallery_items (publish_status, visibility);
create index sponsors_publish_idx on public.sponsors (publish_status, visibility);
create index recruitment_applications_status_idx on public.recruitment_applications (status);

create schema if not exists private;
create or replace function private.has_any_role(required_roles public.user_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = any(required_roles));
$$;
revoke execute on function private.has_any_role(public.user_role[]) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_any_role(public.user_role[]) to authenticated;

alter table public.profiles enable row level security;
alter table public.robots enable row level security;
alter table public.robot_media enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_evidence enable row level security;
alter table public.team_members enable row level security;
alter table public.research_posts enable row level security;
alter table public.gallery_items enable row level security;
alter table public.sponsors enable row level security;
alter table public.recruitment_settings enable row level security;
alter table public.recruitment_applications enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;

create policy public_robots_read on public.robots for select to anon, authenticated using (publish_status = 'published' and visibility = 'public');
create policy public_robot_media_read on public.robot_media for select to anon, authenticated using (visibility = 'public' and exists (select 1 from public.robots r where r.id = robot_id and r.publish_status = 'published' and r.visibility = 'public'));
create policy public_competitions_read on public.competitions for select to anon, authenticated using (publish_status = 'published' and visibility = 'public');
create policy public_evidence_read on public.competition_evidence for select to anon, authenticated using (exists (select 1 from public.competitions c where c.id = competition_id and c.publish_status = 'published' and c.visibility = 'public'));
create policy public_team_members_read on public.team_members for select to anon, authenticated using (publish_status = 'published' and visibility = 'public');
create policy public_research_read on public.research_posts for select to anon, authenticated using (publish_status = 'published' and visibility = 'public');
create policy public_gallery_read on public.gallery_items for select to anon, authenticated using (publish_status = 'published' and visibility = 'public');
create policy public_sponsors_read on public.sponsors for select to anon, authenticated using (publish_status = 'published' and visibility = 'public');

create policy internal_robots_read on public.robots for select to authenticated using ((select private.has_any_role(array['super_admin','team_lead','technical_lead','media','hr_operations','viewer']::public.user_role[])));
create policy technical_robots_write on public.robots for all to authenticated using ((select private.has_any_role(array['super_admin','team_lead','technical_lead']::public.user_role[]))) with check ((select private.has_any_role(array['super_admin','team_lead','technical_lead']::public.user_role[])));
create policy media_robot_media_write on public.robot_media for all to authenticated using ((select private.has_any_role(array['super_admin','team_lead','technical_lead','media']::public.user_role[]))) with check ((select private.has_any_role(array['super_admin','team_lead','technical_lead','media']::public.user_role[])));
create policy internal_competitions_read on public.competitions for select to authenticated using ((select private.has_any_role(array['super_admin','team_lead','technical_lead','media','hr_operations','viewer']::public.user_role[])));
create policy leadership_competitions_write on public.competitions for all to authenticated using ((select private.has_any_role(array['super_admin','team_lead','technical_lead']::public.user_role[]))) with check ((select private.has_any_role(array['super_admin','team_lead','technical_lead']::public.user_role[])));
create policy internal_evidence_read on public.competition_evidence for select to authenticated using ((select private.has_any_role(array['super_admin','team_lead','technical_lead','media','hr_operations','viewer']::public.user_role[])));
create policy evidence_write on public.competition_evidence for all to authenticated using ((select private.has_any_role(array['super_admin','team_lead','technical_lead','media']::public.user_role[]))) with check ((select private.has_any_role(array['super_admin','team_lead','technical_lead','media']::public.user_role[])));
create policy internal_team_read on public.team_members for select to authenticated using ((select private.has_any_role(array['super_admin','team_lead','technical_lead','media','hr_operations','viewer']::public.user_role[])));
create policy hr_team_write on public.team_members for all to authenticated using ((select private.has_any_role(array['super_admin','team_lead','hr_operations']::public.user_role[]))) with check ((select private.has_any_role(array['super_admin','team_lead','hr_operations']::public.user_role[])));
create policy internal_research_read on public.research_posts for select to authenticated using ((select private.has_any_role(array['super_admin','team_lead','technical_lead','media','hr_operations','viewer']::public.user_role[])));
create policy research_write on public.research_posts for all to authenticated using ((select private.has_any_role(array['super_admin','team_lead','technical_lead','media']::public.user_role[]))) with check ((select private.has_any_role(array['super_admin','team_lead','technical_lead','media']::public.user_role[])));
create policy internal_gallery_read on public.gallery_items for select to authenticated using ((select private.has_any_role(array['super_admin','team_lead','technical_lead','media','hr_operations','viewer']::public.user_role[])));
create policy media_gallery_write on public.gallery_items for all to authenticated using ((select private.has_any_role(array['super_admin','team_lead','media']::public.user_role[]))) with check ((select private.has_any_role(array['super_admin','team_lead','media']::public.user_role[])));
create policy internal_sponsors_read on public.sponsors for select to authenticated using ((select private.has_any_role(array['super_admin','team_lead','hr_operations','viewer']::public.user_role[])));
create policy leadership_sponsors_write on public.sponsors for all to authenticated using ((select private.has_any_role(array['super_admin','team_lead']::public.user_role[]))) with check ((select private.has_any_role(array['super_admin','team_lead']::public.user_role[])));

create policy own_profile_read on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy admin_profiles_read on public.profiles for select to authenticated using ((select private.has_any_role(array['super_admin','team_lead','hr_operations','viewer']::public.user_role[])));
create policy super_admin_profiles_write on public.profiles for all to authenticated using ((select private.has_any_role(array['super_admin']::public.user_role[]))) with check ((select private.has_any_role(array['super_admin']::public.user_role[])));
create policy internal_recruitment_read on public.recruitment_settings for select to authenticated using ((select private.has_any_role(array['super_admin','team_lead','hr_operations','viewer']::public.user_role[])));
create policy hr_recruitment_settings_write on public.recruitment_settings for all to authenticated using ((select private.has_any_role(array['super_admin','team_lead','hr_operations']::public.user_role[]))) with check ((select private.has_any_role(array['super_admin','team_lead','hr_operations']::public.user_role[])));
create policy hr_applications_write on public.recruitment_applications for all to authenticated using ((select private.has_any_role(array['super_admin','team_lead','hr_operations']::public.user_role[]))) with check ((select private.has_any_role(array['super_admin','team_lead','hr_operations']::public.user_role[])));
create policy staff_contact_read on public.contact_messages for select to authenticated using ((select private.has_any_role(array['super_admin','team_lead','hr_operations','media']::public.user_role[])));
create policy staff_contact_update on public.contact_messages for update to authenticated using ((select private.has_any_role(array['super_admin','team_lead','hr_operations','media']::public.user_role[]))) with check ((select private.has_any_role(array['super_admin','team_lead','hr_operations','media']::public.user_role[])));
create policy internal_audit_read on public.audit_logs for select to authenticated using ((select private.has_any_role(array['super_admin','team_lead','technical_lead','media','hr_operations','viewer']::public.user_role[])));
create policy admin_audit_insert on public.audit_logs for insert to authenticated with check ((select private.has_any_role(array['super_admin','team_lead','technical_lead','media','hr_operations']::public.user_role[])));

-- Public recruitment/contact inserts are intentionally handled by server-side actions with validation and rate limiting.