-- Prevent new robot media rows with empty alt text or invalid display order.
-- NOT VALID preserves existing rows for a separate data-quality review while enforcing new writes.
do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'robot_media_alt_text_nonempty'
      and conrelid = 'public.robot_media'::regclass
  ) then
    alter table public.robot_media
      add constraint robot_media_alt_text_nonempty
      check (length(trim(alt_text)) > 0) not valid;
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'robot_media_sort_order_nonnegative'
      and conrelid = 'public.robot_media'::regclass
  ) then
    alter table public.robot_media
      add constraint robot_media_sort_order_nonnegative
      check (sort_order >= 0) not valid;
  end if;
end;
$$;
