-- Add consistent creator/updater provenance to content tables that lacked it.
alter table public.team_members
  add column if not exists created_by uuid references public.profiles(id),
  add column if not exists updated_by uuid references public.profiles(id);

alter table public.research_posts
  add column if not exists created_by uuid references public.profiles(id),
  add column if not exists updated_by uuid references public.profiles(id);

alter table public.gallery_items
  add column if not exists created_by uuid references public.profiles(id),
  add column if not exists updated_by uuid references public.profiles(id);

alter table public.sponsors
  add column if not exists created_by uuid references public.profiles(id),
  add column if not exists updated_by uuid references public.profiles(id);
