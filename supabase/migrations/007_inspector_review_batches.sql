alter table public.cracks
  add column if not exists review_state text not null default 'pending',
  add column if not exists duplicate_of_id uuid references public.cracks(id) on delete restrict,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cracks_review_state_valid'
      and conrelid = 'public.cracks'::regclass
  ) then
    alter table public.cracks
      add constraint cracks_review_state_valid
      check (review_state in ('pending', 'reviewed', 'duplicate', 'forwarded'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'cracks_duplicate_state_consistent'
      and conrelid = 'public.cracks'::regclass
  ) then
    alter table public.cracks
      add constraint cracks_duplicate_state_consistent
      check (
        (review_state = 'duplicate' and duplicate_of_id is not null and duplicate_of_id <> id)
        or (review_state <> 'duplicate' and duplicate_of_id is null)
      );
  end if;
end
$$;

create index if not exists cracks_review_state_detected_at_idx
  on public.cracks (review_state, detected_at desc);

create table if not exists public.crack_review_notes (
  id uuid primary key default gen_random_uuid(),
  crack_id uuid not null references public.cracks(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  note text not null check (length(btrim(note)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists crack_review_notes_crack_created_idx
  on public.crack_review_notes (crack_id, created_at);

create table if not exists public.inspection_batches (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references auth.users(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  review_status text not null default 'pending_review'
    check (review_status in ('pending_review', 'reviewed', 'changes_requested')),
  department_note text check (department_note is null or length(department_note) <= 2000),
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  check (
    (review_status = 'pending_review' and reviewed_by is null and reviewed_at is null)
    or (review_status <> 'pending_review' and reviewed_by is not null and reviewed_at is not null)
  )
);

create table if not exists public.inspection_batch_items (
  batch_id uuid not null references public.inspection_batches(id) on delete cascade,
  crack_id uuid not null references public.cracks(id) on delete restrict,
  primary key (batch_id, crack_id)
);

create index if not exists inspection_batches_submitted_at_idx
  on public.inspection_batches (submitted_at desc);

alter table public.crack_review_notes enable row level security;
alter table public.inspection_batches enable row level security;
alter table public.inspection_batch_items enable row level security;

create or replace view public.crack_records as
select id, location, latitude, longitude, image_url, crack_type, severity, status,
  width_mm, length_mm, depth_mm, description, assigned_to,
  detected_at, resolved_at, created_at, updated_at,
  source_device_id, source_detection_id,
  review_state, duplicate_of_id, reviewed_by, reviewed_at
from public.cracks;

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

  perform c.id
  from public.cracks c
  where c.id = any(p_crack_ids)
  order by c.id
  for update;

  if (select count(*) from public.cracks where id = any(p_crack_ids) and review_state = 'reviewed') <> cardinality(p_crack_ids) then
    raise exception 'Every selected detection must be reviewed and not already forwarded.';
  end if;

  insert into public.inspection_batches (submitted_by)
  values (p_submitted_by)
  returning id into new_batch_id;

  insert into public.inspection_batch_items (batch_id, crack_id)
  select new_batch_id, selected.id
  from unnest(p_crack_ids) as selected(id);

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
begin
  if p_review_status not in ('reviewed', 'changes_requested') then
    raise exception 'Choose reviewed or changes requested.';
  end if;
  if p_department_note is not null and length(p_department_note) > 2000 then
    raise exception 'Department note must be at most 2000 characters.';
  end if;

  perform 1
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
    update public.cracks c
    set review_state = 'pending',
        reviewed_by = null,
        reviewed_at = null,
        updated_at = now()
    from public.inspection_batch_items i
    where i.batch_id = p_batch_id and i.crack_id = c.id;
  end if;
end;
$$;

revoke all on function public.review_inspection_batch(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.review_inspection_batch(uuid, text, text, uuid) to service_role;
