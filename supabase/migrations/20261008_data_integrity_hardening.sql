-- Production data-integrity hardening.
-- Safe to re-run; existing constraints are detected before creation.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'robots_weight_nonnegative') then
    alter table public.robots add constraint robots_weight_nonnegative check (weight_kg is null or weight_kg >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'robots_year_reasonable') then
    alter table public.robots add constraint robots_year_reasonable check (development_year between 1900 and 2100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'robots_slug_format') then
    alter table public.robots add constraint robots_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'competitions_year_reasonable') then
    alter table public.competitions add constraint competitions_year_reasonable check (year between 1900 and 2100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'competitions_slug_format') then
    alter table public.competitions add constraint competitions_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'team_members_slug_format') then
    alter table public.team_members add constraint team_members_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'team_members_photo_https') then
    alter table public.team_members add constraint team_members_photo_https check (photo_url is null or photo_url ~ '^https://');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'research_posts_slug_format') then
    alter table public.research_posts add constraint research_posts_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gallery_source_https') then
    alter table public.gallery_items add constraint gallery_source_https check (source_url ~ '^https://');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gallery_thumbnail_https') then
    alter table public.gallery_items add constraint gallery_thumbnail_https check (thumbnail_url is null or thumbnail_url ~ '^https://');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gallery_youtube_host') then
    alter table public.gallery_items add constraint gallery_youtube_host check (
      source_type <> 'youtube'
      or lower(split_part(split_part(source_url, '://', 2), '/', 1)) in ('youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be')
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sponsors_logo_https') then
    alter table public.sponsors add constraint sponsors_logo_https check (logo_url is null or logo_url ~ '^https://');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sponsors_website_https') then
    alter table public.sponsors add constraint sponsors_website_https check (website_url is null or website_url ~ '^https://');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'recruitment_status_valid') then
    alter table public.recruitment_applications add constraint recruitment_status_valid check (status in ('Submitted','Shortlisted','Interview','Selected','Rejected','Withdrawn'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contact_status_valid') then
    alter table public.contact_messages add constraint contact_status_valid check (status in ('New','In Progress','Resolved'));
  end if;
end
$$;

create index if not exists competition_evidence_competition_idx on public.competition_evidence (competition_id);
create index if not exists robot_media_robot_idx on public.robot_media (robot_id);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists public_submission_rate_limits_updated_idx on public.public_submission_rate_limits (updated_at);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists robots_set_updated_at on public.robots;
create trigger robots_set_updated_at before update on public.robots for each row execute function public.set_updated_at();

drop trigger if exists competitions_set_updated_at on public.competitions;
create trigger competitions_set_updated_at before update on public.competitions for each row execute function public.set_updated_at();

drop trigger if exists team_members_set_updated_at on public.team_members;
create trigger team_members_set_updated_at before update on public.team_members for each row execute function public.set_updated_at();

drop trigger if exists research_posts_set_updated_at on public.research_posts;
create trigger research_posts_set_updated_at before update on public.research_posts for each row execute function public.set_updated_at();

drop trigger if exists sponsors_set_updated_at on public.sponsors;
create trigger sponsors_set_updated_at before update on public.sponsors for each row execute function public.set_updated_at();

drop trigger if exists recruitment_settings_set_updated_at on public.recruitment_settings;
create trigger recruitment_settings_set_updated_at before update on public.recruitment_settings for each row execute function public.set_updated_at();

drop trigger if exists public_submission_rate_limits_set_updated_at on public.public_submission_rate_limits;
create trigger public_submission_rate_limits_set_updated_at before update on public.public_submission_rate_limits for each row execute function public.set_updated_at();

revoke all on function public.set_updated_at() from public, anon, authenticated;
