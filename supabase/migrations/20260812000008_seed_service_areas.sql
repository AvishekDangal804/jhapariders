-- Phase 14: seed public.service_areas from the static Jhapa location list
-- in src/config/service-areas.ts. That file's own comment says it exists
-- partly "to seed the migration's demo data," but nothing ever actually
-- ran the insert — the table (and so /admin/service-areas) has been empty
-- since Phase 3. idempotent via the table's unique slug constraint.
insert into public.service_areas (slug, name, lat, lng, is_active) values
  ('birtamode', 'Birtamode', 26.6425, 87.9974, true),
  ('damak', 'Damak', 26.6667, 87.7, true),
  ('mechinagar', 'Mechinagar', 26.6586, 88.145, true),
  ('kakarbhitta', 'Kakarbhitta', 26.6551, 88.1728, true),
  ('dhulabari', 'Dhulabari', 26.6167, 88.1333, true),
  ('charali', 'Charali', 26.6197, 88.0667, true),
  ('bhadrapur', 'Bhadrapur', 26.5444, 88.0999, true),
  ('chandragadhi', 'Chandragadhi', 26.5667, 88.0833, true),
  ('kankai', 'Kankai', 26.5833, 87.9333, true),
  ('surunga', 'Surunga', 26.5833, 87.9833, true),
  ('budhabare', 'Budhabare', 26.5978, 88.0367, true),
  ('arjundhara', 'Arjundhara', 26.6167, 87.95, true),
  ('shivasatakshi', 'Shivasatakshi', 26.5, 87.85, false),
  ('gauradaha', 'Gauradaha', 26.5333, 87.8667, false)
on conflict (slug) do nothing;
