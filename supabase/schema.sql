-- Isi Perut — Supabase PostgreSQL Schema & Realtime Setup
-- Jalankan script ini di Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  slug text not null unique,
  emoji text not null default '🍽️',
  color_token text not null default 'red'
    check (color_token in ('red', 'orange', 'green', 'purple')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.places (
  id text primary key default gen_random_uuid()::text,
  category_id text not null references public.categories(id) on delete cascade,
  name text not null,
  notes text[] not null default '{}',
  area text,
  city text not null default 'makassar'
    check (city in ('makassar', 'jakarta')),
  lat double precision,
  lng double precision,
  maps_url text,
  added_by text not null default 'Tim Makassar',
  is_visited boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.friends (
  name text primary key,
  can_edit boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_friends_name_lower
  on public.friends (lower(name));

create index if not exists idx_categories_sort_order
  on public.categories (sort_order asc, created_at asc);

create index if not exists idx_places_category_sort
  on public.places (category_id, sort_order asc, created_at asc);

-- Default categories matching src/data/seed-makassar.json
insert into public.categories (id, name, slug, emoji, color_token, sort_order)
values
  ('11111111-1111-4111-8111-111111111101', 'MAM', 'mam', '🍱', 'red', 0),
  ('11111111-1111-4111-8111-111111111102', 'NUM', 'num', '🧋', 'orange', 1),
  ('11111111-1111-4111-8111-111111111103', 'Romantic Dinner', 'romantic-dinner', '🕯️', 'purple', 2)
on conflict (id) do nothing;

insert into public.friends (name, can_edit)
values ('pije', true), ('caca', true)
on conflict (name) do update set can_edit = excluded.can_edit;

-- Row Level Security (kolaborasi ringan tanpa login wajib untuk grup teman)
alter table public.categories enable row level security;
alter table public.places enable row level security;
alter table public.friends enable row level security;

drop policy if exists "Public read friends" on public.friends;
create policy "Public read friends"
  on public.friends for select
  using (true);

drop policy if exists "Public write friends" on public.friends;
create policy "Public write friends"
  on public.friends for all
  using (true)
  with check (true);

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories"
  on public.categories for select
  using (true);

drop policy if exists "Public write categories" on public.categories;
create policy "Public write categories"
  on public.categories for all
  using (true)
  with check (true);

drop policy if exists "Public read places" on public.places;
create policy "Public read places"
  on public.places for select
  using (true);

drop policy if exists "Public write places" on public.places;
create policy "Public write places"
  on public.places for all
  using (true)
  with check (true);

-- Aktifkan Supabase Realtime untuk sinkronisasi langsung antar teman
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table public.categories;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'places'
  ) then
    alter publication supabase_realtime add table public.places;
  end if;
end $$;
