insert into public.authorities (name, email, phone, city, state, zip, is_default)
values
  ('San Francisco Public Works', 'pw@sfgov.org', '415-554-6920', 'San Francisco', 'CA', '94103', false),
  ('Austin Transportation and Public Works', 'transportation@austintexas.gov', '512-974-2000', 'Austin', 'TX', '78701', false),
  ('311 Public Works Intake', '311@example.gov', '311', 'Default', 'US', null, true)
on conflict (email) do update set
  name = excluded.name,
  phone = excluded.phone,
  city = excluded.city,
  state = excluded.state,
  zip = excluded.zip,
  is_default = excluded.is_default;
