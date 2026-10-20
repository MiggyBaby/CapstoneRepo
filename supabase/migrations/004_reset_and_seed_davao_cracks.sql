-- Run only after 003_dpwh_crack_types.sql has completed successfully.
-- This replaces crack rows only; validation reports and other tables are untouched.
begin;

delete from public.cracks;

insert into public.cracks (
  location,
  latitude,
  longitude,
  coordinates,
  crack_type,
  severity,
  status,
  width_mm,
  length_mm,
  description,
  detected_at
)
values
  (
    'SAMPLE - Davao City, Bajada', 7.0975, 125.6138,
    st_setsrid(st_makepoint(125.6138, 7.0975), 4326)::geography,
    'transverse', 'high', 'new', 2.4, 115,
    'Synthetic sample for demonstration and testing; not a verified DPWH field inspection.', now()
  ),
  (
    'SAMPLE - Davao City, Matina Crossing', 7.0643, 125.5988,
    st_setsrid(st_makepoint(125.5988, 7.0643), 4326)::geography,
    'longitudinal', 'medium', 'new', 1.6, 82,
    'Synthetic sample for demonstration and testing; not a verified DPWH field inspection.', now() - interval '1 hour'
  ),
  (
    'SAMPLE - Davao City, Ecoland', 7.0486, 125.6082,
    st_setsrid(st_makepoint(125.6082, 7.0486), 4326)::geography,
    'block', 'high', 'new', 3.1, 64,
    'Synthetic sample for demonstration and testing; not a verified DPWH field inspection.', now() - interval '2 hours'
  ),
  (
    'SAMPLE - Davao City, Lanang', 7.1148, 125.6475,
    st_setsrid(st_makepoint(125.6475, 7.1148), 4326)::geography,
    'corner', 'medium', 'new', 1.8, 28,
    'Synthetic sample for demonstration and testing; not a verified DPWH field inspection.', now() - interval '3 hours'
  ),
  (
    'SAMPLE - Davao City, Buhangin', 7.1032, 125.6257,
    st_setsrid(st_makepoint(125.6257, 7.1032), 4326)::geography,
    'diagonal', 'low', 'new', 1.2, 41,
    'Synthetic sample for demonstration and testing; not a verified DPWH field inspection.', now() - interval '4 hours'
  ),
  (
    'SAMPLE - Davao City, Agdao', 7.0835, 125.6204,
    st_setsrid(st_makepoint(125.6204, 7.0835), 4326)::geography,
    'meandering', 'medium', 'new', 1.9, 57,
    'Synthetic sample for demonstration and testing; not a verified DPWH field inspection.', now() - interval '5 hours'
  ),
  (
    'SAMPLE - Davao City, Maa', 7.0917, 125.5742,
    st_setsrid(st_makepoint(125.5742, 7.0917), 4326)::geography,
    'reflection', 'high', 'new', 2.2, 73,
    'Synthetic sample for demonstration and testing; not a verified DPWH field inspection.', now() - interval '6 hours'
  );

commit;