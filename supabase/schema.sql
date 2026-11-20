-- Gucci Gadgets — Supabase schema.
-- Run this once in the Supabase SQL editor, then run seed.sql.
-- RLS: anyone can read; only an authenticated user (the single owner account) can write.

create extension if not exists pgcrypto;

-- ---------- products ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text not null check (brand in ('Apple','Samsung','Google','Tecno','Infinix','Redmi','Other')),
  category text not null check (category in ('phone','accessory','gadget')),
  condition text not null default 'new' check (condition in ('new','uk_used')),
  description text not null default '',
  specs jsonb not null default '{}'::jsonb,
  images text[] not null default '{}',
  tags text[] not null default '{}',          -- deal, new_arrival, price_drop, best_seller
  deal_ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- variants (with UK-used details) ----------
create table if not exists public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage text,                                -- e.g. 128GB, 1TB; null for accessories
  colour text,
  price integer not null check (price >= 0),   -- naira
  old_price integer check (old_price is null or old_price >= 0),
  in_stock boolean not null default true,
  stock_qty integer not null default 0 check (stock_qty >= 0),
  grade text check (grade in ('A+','A','B')),
  battery_health integer check (battery_health between 0 and 100),
  warranty_months integer check (warranty_months >= 0),
  notes text
);
create index if not exists variants_product_id_idx on public.variants(product_id);

-- ---------- swap values ----------
create table if not exists public.swap_values (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  storage text not null,
  base_value integer not null check (base_value >= 0), -- clean, Grade A unit
  is_active boolean not null default true,
  unique (model, storage)
);

-- ---------- repair prices ----------
create table if not exists public.repair_prices (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  issue text not null check (issue in ('Screen','Battery','Charging port','Back glass','Camera','Face ID','Water damage')),
  price_from integer not null check (price_from >= 0),
  duration text not null default 'Same day'
);

-- ---------- settings (single row, id = 1) ----------
create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  whatsapp_number text not null,
  store_address text not null,
  opening_hours text not null,
  delivery_note text not null,
  instagram_handle text not null default ''
);

-- ---------- reviews (placeholder) ----------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  text text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  area text not null,
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
do $$
declare t text;
begin
  foreach t in array array['products','variants','swap_values','repair_prices','settings','reviews'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('drop policy if exists "owner write" on public.%I', t);
    execute format('create policy "owner write" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ---------- Storage bucket for product photos ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "owner upload product images" on storage.objects;
create policy "owner upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

drop policy if exists "owner delete product images" on storage.objects;
create policy "owner delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');
