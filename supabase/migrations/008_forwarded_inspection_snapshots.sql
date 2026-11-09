alter table public.inspection_batch_items
  add column if not exists crack_snapshot jsonb,
  add column if not exists crack_review_notes_snapshot jsonb not null default '[]'::jsonb;

update public.inspection_batch_items item
set crack_snapshot = jsonb_build_object(
  'id', crack.id,
  'location', crack.location,
  'latitude', crack.latitude,
  'longitude', crack.longitude,
  'image_url', crack.image_url,
  'crack_type', crack.crack_type,
  'severity', crack.severity,
  'status', crack.status,
  'width_mm', crack.width_mm,
  'length_mm', crack.length_mm,
  'depth_mm', crack.depth_mm,
  'description', crack.description,
  'detected_at', crack.detected_at,
  'source_device_id', crack.source_device_id,
  'review_state', 'forwarded'
)
from public.cracks crack
where crack.id = item.crack_id
  and item.crack_snapshot is null;

update public.inspection_batch_items item
set crack_review_notes_snapshot = notes.notes
from (
  select batch_item.batch_id, batch_item.crack_id,
    coalesce(
      jsonb_agg(jsonb_build_object(
        'id', note.id,
        'author_id', note.author_id,
        'note', note.note,
        'created_at', note.created_at
      ) order by note.created_at) filter (where note.id is not null),
      '[]'::jsonb
    ) as notes
  from public.inspection_batch_items batch_item
  left join public.crack_review_notes note on note.crack_id = batch_item.crack_id
  group by batch_item.batch_id, batch_item.crack_id
) notes
where notes.batch_id = item.batch_id
  and notes.crack_id = item.crack_id;

alter table public.inspection_batch_items
  alter column crack_snapshot set not null;

create or replace function public.forward_inspection_batch(
  p_crack_ids uuid[],
  p_submitted_by uuid
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_batch_id uuid;
  unique_count integer;
begin
  if p_crack_ids is null or cardinality(p_crack_ids) = 0 or cardinality(p_crack_ids) > 500 then
    raise exception 'Select between 1 and 500 reviewed detections.';
  end if;

  select count(distinct selected.id) into unique_count
  from unnest(p_crack_ids) as selected(id);
  if unique_count <> cardinality(p_crack_ids) then
    raise exception 'Duplicate detection IDs are not allowed.';
  end if;

  perform crack.id
  from public.cracks crack
  where crack.id = any(p_crack_ids)
  order by crack.id
  for update;

  if (
    select count(*)
    from public.cracks
    where id = any(p_crack_ids) and review_state = 'reviewed'
  ) <> cardinality(p_crack_ids) then
    raise exception 'Every selected detection must be reviewed and not already forwarded.';
  end if;

  insert into public.inspection_batches (submitted_by)
  values (p_submitted_by)
  returning id into new_batch_id;

  insert into public.inspection_batch_items (
    batch_id,
    crack_id,
    crack_snapshot,
    crack_review_notes_snapshot
  )
  select
    new_batch_id,
    crack.id,
    jsonb_build_object(
      'id', crack.id,
      'location', crack.location,
      'latitude', crack.latitude,
      'longitude', crack.longitude,
      'image_url', crack.image_url,
      'crack_type', crack.crack_type,
      'severity', crack.severity,
      'status', crack.status,
      'width_mm', crack.width_mm,
      'length_mm', crack.length_mm,
      'depth_mm', crack.depth_mm,
      'description', crack.description,
      'detected_at', crack.detected_at,
      'source_device_id', crack.source_device_id,
      'review_state', 'forwarded'
    ),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', note.id,
        'author_id', note.author_id,
        'note', note.note,
        'created_at', note.created_at
      ) order by note.created_at)
      from public.crack_review_notes note
      where note.crack_id = crack.id
    ), '[]'::jsonb)
  from public.cracks crack
  where crack.id = any(p_crack_ids);

  update public.cracks
  set review_state = 'forwarded', updated_at = now()
  where id = any(p_crack_ids);

  return new_batch_id;
end;
$$;

revoke all on function public.forward_inspection_batch(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.forward_inspection_batch(uuid[], uuid) to service_role;

create or replace function public.review_inspection_batch(
  p_batch_id uuid,
  p_review_status text,
  p_department_note text,
  p_reviewed_by uuid
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  batch_submitted_at timestamptz;
begin
  if p_review_status not in ('reviewed', 'changes_requested') then
    raise exception 'Choose reviewed or changes requested.';
  end if;
  if p_department_note is not null and length(p_department_note) > 2000 then
    raise exception 'Department note must be at most 2000 characters.';
  end if;

  select submitted_at into batch_submitted_at
  from public.inspection_batches
  where id = p_batch_id and review_status = 'pending_review'
  for update;
  if not found then
    raise exception 'Batch not found or already reviewed.';
  end if;

  update public.inspection_batches
  set review_status = p_review_status,
      department_note = p_department_note,
      reviewed_by = p_reviewed_by,
      reviewed_at = now()
  where id = p_batch_id;

  if p_review_status = 'changes_requested' then
    update public.cracks crack
    set review_state = 'pending',
        reviewed_by = null,
        reviewed_at = null,
        updated_at = now()
    from public.inspection_batch_items item
    where item.batch_id = p_batch_id
      and item.crack_id = crack.id
      and crack.review_state = 'forwarded'
      and not exists (
        select 1
        from public.inspection_batch_items newer_item
        join public.inspection_batches newer_batch on newer_batch.id = newer_item.batch_id
        where newer_item.crack_id = crack.id
          and newer_batch.submitted_at > batch_submitted_at
      );
  end if;
end;
$$;

revoke all on function public.review_inspection_batch(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.review_inspection_batch(uuid, text, text, uuid) to service_role;
