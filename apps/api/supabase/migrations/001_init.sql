create extension if not exists "pgcrypto";

create table if not exists public.authorities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  city text not null,
  state text not null,
  zip text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists authorities_zip_idx on public.authorities (zip);
create index if not exists authorities_city_state_idx on public.authorities (lower(city), lower(state));
create unique index if not exists authorities_single_default_idx on public.authorities (is_default) where is_default = true;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  issue_type text not null,
  notes text,
  latitude double precision not null,
  longitude double precision not null,
  city text not null,
  state text not null,
  zip text not null,
  formatted_address text,
  authority_name text not null,
  authority_email text not null,
  authority_phone text,
  authority_source text not null check (authority_source in ('exact', 'city_fallback', 'default')),
  email_subject text not null,
  email_body text not null,
  status text not null check (status in ('queued', 'sent', 'failed')),
  failure_reason text,
  image_urls text[] not null default '{}',
  thumbnail_url text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists reports_user_created_idx on public.reports (user_id, created_at desc);

alter table public.authorities enable row level security;
alter table public.reports enable row level security;

create policy if not exists "No direct anonymous authority access"
  on public.authorities
  for all
  to anon
  using (false)
  with check (false);

create policy if not exists "No direct anonymous report access"
  on public.reports
  for all
  to anon
  using (false)
  with check (false);
