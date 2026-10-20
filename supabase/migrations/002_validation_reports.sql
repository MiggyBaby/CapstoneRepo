create table if not exists public.validation_reports (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  district_office text not null,
  inspection_date date not null,
  validation_date date,
  stationing text not null default '',
  landmark text not null default '',
  road_section text not null,
  defect_code text not null check (defect_code in (
    '01', '02', '03', '04', '05', '06-A', '06-C', '06-P', '06-Y', '07',
    '08', '09', '10', '11', '12', '13', '14', '15-B', '15-P', '15-S', '16'
  )),
  estimated_quantity numeric check (estimated_quantity >= 0),
  unit_of_measure text not null default '',
  remarks text not null default '',
  prepared_by text not null,
  designation text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists validation_reports_inspection_date_idx
  on public.validation_reports (inspection_date desc);

alter table public.validation_reports enable row level security;