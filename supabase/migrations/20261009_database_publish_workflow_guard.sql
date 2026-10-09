-- Enforce the public publishing boundary in the database as well as server actions.
-- This protects against direct authenticated Supabase updates that bypass the admin UI.
create or replace function public.enforce_content_publish_workflow()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_role public.user_role;
  is_leader boolean;
begin
  select p.role into actor_role
  from public.profiles p
  where p.id = (select auth.uid());

  is_leader := coalesce(actor_role in ('super_admin', 'team_lead'), false);

  -- Published and archived records must not be removable through direct table deletes.
  -- Keep historical/approved content auditable; use the archive workflow instead.
  if tg_op = 'DELETE' then
    if old.publish_status in ('published', 'archived') then
      raise exception 'Published or archived content cannot be deleted; archive or retain it instead'
        using errcode = '42501';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if new.publish_status = 'published' then
      raise exception 'Content must pass review before publication'
        using errcode = '42501';
    end if;
    if new.publish_status = 'archived' and not is_leader then
      raise exception 'Only team leadership may archive content'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if old.publish_status = 'archived' and new.publish_status <> 'archived' then
    raise exception 'Archived content cannot be reopened through direct updates'
      using errcode = '42501';
  end if;

  if old.publish_status = 'archived'
     and (to_jsonb(new) - 'updated_at' - 'updated_by')
         is distinct from (to_jsonb(old) - 'updated_at' - 'updated_by') then
    raise exception 'Archived content is immutable'
      using errcode = '42501';
  end if;

  if new.publish_status = 'published'
     and (old.publish_status <> 'review' or not is_leader) then
    raise exception 'Only team leadership may publish reviewed content'
      using errcode = '42501';
  end if;

  if new.publish_status = 'archived' and old.publish_status <> 'archived'
     and not is_leader then
    raise exception 'Only team leadership may archive content'
      using errcode = '42501';
  end if;

  if old.publish_status = 'published'
     and new.publish_status <> 'published'
     and not is_leader then
    raise exception 'Only team leadership may unpublish content'
      using errcode = '42501';
  end if;

  if old.publish_status = 'published'
     and (to_jsonb(new) - 'updated_at' - 'updated_by' - 'publish_status')
         is distinct from (to_jsonb(old) - 'updated_at' - 'updated_by' - 'publish_status') then
    if not is_leader or new.publish_status <> 'draft' then
      raise exception 'Published content edits require leadership and must return to draft'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_content_publish_workflow() from public, anon, authenticated;

drop trigger if exists robots_publish_workflow_guard on public.robots;
create trigger robots_publish_workflow_guard before insert or update or delete on public.robots
for each row execute function public.enforce_content_publish_workflow();

drop trigger if exists competitions_publish_workflow_guard on public.competitions;
create trigger competitions_publish_workflow_guard before insert or update or delete on public.competitions
for each row execute function public.enforce_content_publish_workflow();

drop trigger if exists team_members_publish_workflow_guard on public.team_members;
create trigger team_members_publish_workflow_guard before insert or update or delete on public.team_members
for each row execute function public.enforce_content_publish_workflow();

drop trigger if exists research_posts_publish_workflow_guard on public.research_posts;
create trigger research_posts_publish_workflow_guard before insert or update or delete on public.research_posts
for each row execute function public.enforce_content_publish_workflow();

drop trigger if exists gallery_items_publish_workflow_guard on public.gallery_items;
create trigger gallery_items_publish_workflow_guard before insert or update or delete on public.gallery_items
for each row execute function public.enforce_content_publish_workflow();

drop trigger if exists sponsors_publish_workflow_guard on public.sponsors;
create trigger sponsors_publish_workflow_guard before insert or update or delete on public.sponsors
for each row execute function public.enforce_content_publish_workflow();
