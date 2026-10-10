-- Optional approved cover image for public research articles.
alter table public.research_posts
  add column if not exists cover_image_url text;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'research_posts_cover_image_https'
      and conrelid = 'public.research_posts'::regclass
  ) then
    alter table public.research_posts
      add constraint research_posts_cover_image_https
      check (cover_image_url is null or cover_image_url ~ '^https://') not valid;
  end if;
end;
$$;
