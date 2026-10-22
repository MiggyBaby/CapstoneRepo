create table if not exists public.district_summaries (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  district_office text not null,
  inspection_date date not null,
  validation_date date,
  sections jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array'),
  prepared_by text not null,
  prepared_designation text not null default '',
  reviewed_by text not null,
  reviewed_designation text not null default '',
  noted_by text not null,
  noted_designation text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists district_summaries_inspection_date_idx
  on public.district_summaries (inspection_date desc);

alter table public.district_summaries enable row level security;