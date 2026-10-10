-- Read-only preflight for existing data before applying data-integrity constraints.
-- Run against the target staging database first. Any returned row must be reviewed and corrected
-- before the constraint migration is applied. This script does not modify data.

select 'robots' as table_name, id::text as row_id, 'weight_kg must be non-negative when present' as violation
from public.robots where weight_kg is not null and weight_kg < 0
union all
select 'robots', id::text, 'development_year must be between 1900 and 2100'
from public.robots where development_year not between 1900 and 2100
union all
select 'robots', id::text, 'slug must be lowercase alphanumeric words separated by single hyphens'
from public.robots where slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
union all
select 'competitions', id::text, 'year must be between 1900 and 2100'
from public.competitions where year not between 1900 and 2100
union all
select 'competitions', id::text, 'slug must be lowercase alphanumeric words separated by single hyphens'
from public.competitions where slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
union all
select 'team_members', id::text, 'slug must be lowercase alphanumeric words separated by single hyphens'
from public.team_members where slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
union all
select 'team_members', id::text, 'photo_url must use HTTPS when present'
from public.team_members where photo_url is not null and photo_url !~ '^https://'
union all
select 'research_posts', id::text, 'slug must be lowercase alphanumeric words separated by single hyphens'
from public.research_posts where slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
union all
select 'gallery_items', id::text, 'source_url must use HTTPS'
from public.gallery_items where source_url !~ '^https://'
union all
select 'gallery_items', id::text, 'thumbnail_url must use HTTPS when present'
from public.gallery_items where thumbnail_url is not null and thumbnail_url !~ '^https://'
union all
select 'gallery_items', id::text, 'YouTube source must use an approved hostname'
from public.gallery_items
where source_type = 'youtube'
  and lower(split_part(split_part(source_url, '://', 2), '/', 1))
      not in ('youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be')
union all
select 'sponsors', id::text, 'logo_url must use HTTPS when present'
from public.sponsors where logo_url is not null and logo_url !~ '^https://'
union all
select 'sponsors', id::text, 'website_url must use HTTPS when present'
from public.sponsors where website_url is not null and website_url !~ '^https://'
union all
select 'recruitment_applications', id::text, 'status is not recognized by the current application workflow'
from public.recruitment_applications
where status not in ('Submitted','Screening','Shortlisted','Interview','Selected','Rejected','Withdrawn')
union all
select 'contact_messages', id::text, 'status must be New, In Progress, or Resolved'
from public.contact_messages where status not in ('New','In Progress','Resolved')
union all
select 'robot_media', id::text, 'source_url must use HTTPS'
from public.robot_media where source_url !~ '^https://'
union all
select 'competition_evidence', id::text, 'href must use HTTPS'
from public.competition_evidence where href !~ '^https://'
order by table_name, row_id;
