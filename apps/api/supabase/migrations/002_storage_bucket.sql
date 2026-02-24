insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-photos',
  'report-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/heic']
)
on conflict (id) do nothing;
