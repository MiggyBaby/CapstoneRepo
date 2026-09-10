-- Run in Supabase Dashboard -> SQL Editor before starting the app.
create extension if not exists postgis;

create type public.crack_severity as enum ('low', 'medium', 'high', 'critical');
create type public.crack_status as enum ('new', 'assigned', 'in-progress', 'resolved');
create type public.crack_type as enum ('longitudinal', 'transverse', 'alligator', 'edge', 'reflection', 'other');

create table public.cracks (
  id uuid primary key default gen_random_uuid(),
  location text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  coordinates geography(point, 4326) not null,
  image_url text,
  crack_type public.crack_type not null,
  severity public.crack_severity not null,
  status public.crack_status not null default 'new',
  width_mm numeric check (width_mm >= 0),
  length_mm numeric check (length_mm >= 0),
  depth_mm numeric check (depth_mm >= 0),
  description text,
  assigned_to uuid references auth.users(id) on delete set null,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cracks_coordinates_index on public.cracks using gist (coordinates);
create index cracks_detected_at_index on public.cracks (detected_at desc);
create index cracks_severity_index on public.cracks (severity);
create index cracks_status_index on public.cracks (status);

-- Readable representation for the Next.js API; spatial data stays in cracks.
create view public.crack_records as
select id, location, latitude, longitude, image_url, crack_type, severity, status,
  width_mm, length_mm, depth_mm, description, assigned_to,
  detected_at, resolved_at, created_at, updated_at
from public.cracks;

alter table public.cracks enable row level security;

insert into storage.buckets (id, name, public)
values ('crack-images', 'crack-images', true)
on conflict (id) do nothing;

create policy "Public crack image read access"
on storage.objects for select using (bucket_id = 'crack-images');
