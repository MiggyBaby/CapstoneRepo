alter type public.crack_type add value if not exists 'pothole';

alter table public.cracks
  add column if not exists source_device_id text,
  add column if not exists source_detection_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cracks_source_ids_paired'
      and conrelid = 'public.cracks'::regclass
  ) then
    alter table public.cracks
      add constraint cracks_source_ids_paired
      check (
        (source_device_id is null and source_detection_id is null)
        or (
          source_device_id is not null and length(source_device_id) between 1 and 64
          and source_detection_id is not null and length(source_detection_id) between 1 and 128
        )
      );
  end if;
end
$$;

create unique index if not exists cracks_source_detection_unique
  on public.cracks (source_device_id, source_detection_id);

create or replace view public.crack_records as
select id, location, latitude, longitude, image_url, crack_type, severity, status,
  width_mm, length_mm, depth_mm, description, assigned_to,
  detected_at, resolved_at, created_at, updated_at,
  source_device_id, source_detection_id
from public.cracks;
