-- Turkey marketplace — product-based boutique storefronts + orders
-- Run in Supabase SQL Editor after schema.sql
-- Phase 1: data foundation (pre–vergi levhası — sandbox orders only)
--
-- Architecture:
--   tr_boutiques  → seller storefronts (verified boutiques only on /tr)
--   tr_products   → individual clothing items each boutique lists for sale
--   tr_orders     → checkout (service role; sandbox until vergi levhası)
--
-- Editorial outfits / look compositions are NOT boutique inventory.
-- Cortisstyle composes outfits from tr_products later (Studio / outfit builder).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.tr_boutique_status as enum (
    'draft',
    'pending',
    'verified',
    'suspended'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.tr_product_status as enum (
    'available',
    'sold',
    'hidden'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.tr_payment_status as enum (
    'sandbox',
    'pending',
    'paid',
    'failed',
    'refunded'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Boutiques (seller storefronts — product catalog, not outfit bundles)
-- ---------------------------------------------------------------------------
create table if not exists public.tr_boutiques (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  legal_name text,
  description text,
  logo_url text,
  vergi_no text,
  iban text,
  contact_name text,
  contact_phone text,
  shipping_address text,
  return_address text,
  status public.tr_boutique_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tr_boutiques_slug_unique unique (slug)
);

create index if not exists tr_boutiques_status_idx
  on public.tr_boutiques (status);

create index if not exists tr_boutiques_slug_idx
  on public.tr_boutiques (slug);

-- ---------------------------------------------------------------------------
-- Products — one row per sellable clothing item (boutique inventory unit)
-- ---------------------------------------------------------------------------
create table if not exists public.tr_products (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references public.tr_boutiques (id) on delete cascade,
  title text not null,
  description text,
  price_kurus integer not null check (price_kurus > 0),
  size text,
  condition_label text,
  category text,
  images jsonb not null default '[]'::jsonb,
  status public.tr_product_status not null default 'available',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists tr_products_boutique_id_idx
  on public.tr_products (boutique_id);

create index if not exists tr_products_status_idx
  on public.tr_products (status);

create index if not exists tr_products_boutique_status_idx
  on public.tr_products (boutique_id, status, sort_order);

-- ---------------------------------------------------------------------------
-- Orders (checkout uses service role; sandbox until vergi levhası)
-- ---------------------------------------------------------------------------
create table if not exists public.tr_orders (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  shipping_address jsonb not null,
  total_kurus integer not null check (total_kurus >= 0),
  payment_status public.tr_payment_status not null default 'pending',
  is_sandbox boolean not null default true,
  iyzico_payment_id text,
  iyzico_conversation_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists tr_orders_payment_status_idx
  on public.tr_orders (payment_status);

create index if not exists tr_orders_created_at_idx
  on public.tr_orders (created_at desc);

-- ---------------------------------------------------------------------------
-- Order line items (per-product snapshot at purchase time)
-- ---------------------------------------------------------------------------
create table if not exists public.tr_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.tr_orders (id) on delete cascade,
  product_id uuid not null references public.tr_products (id),
  boutique_id uuid not null references public.tr_boutiques (id),
  title text not null,
  price_kurus integer not null check (price_kurus > 0),
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists tr_order_items_order_id_idx
  on public.tr_order_items (order_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.tr_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists tr_boutiques_set_updated_at on public.tr_boutiques;
create trigger tr_boutiques_set_updated_at
before update on public.tr_boutiques
for each row execute function public.tr_set_updated_at();

drop trigger if exists tr_products_set_updated_at on public.tr_products;
create trigger tr_products_set_updated_at
before update on public.tr_products
for each row execute function public.tr_set_updated_at();

drop trigger if exists tr_orders_set_updated_at on public.tr_orders;
create trigger tr_orders_set_updated_at
before update on public.tr_orders
for each row execute function public.tr_set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.tr_boutiques enable row level security;
alter table public.tr_products enable row level security;
alter table public.tr_orders enable row level security;
alter table public.tr_order_items enable row level security;

-- Public read: verified boutiques only (sensitive columns stripped in app layer)
drop policy if exists "TR boutiques public read verified" on public.tr_boutiques;
create policy "TR boutiques public read verified"
  on public.tr_boutiques for select
  using (status = 'verified');

-- Public read: products from verified boutiques (not hidden)
drop policy if exists "TR products public read" on public.tr_products;
create policy "TR products public read"
  on public.tr_products for select
  using (
    status in ('available', 'sold')
    and exists (
      select 1
      from public.tr_boutiques b
      where b.id = boutique_id
        and b.status = 'verified'
    )
  );

-- Orders: no public access — checkout APIs use service role
-- (no select/insert policies for anon or authenticated)

-- ---------------------------------------------------------------------------
-- Optional demo seed (run manually after migration)
-- ---------------------------------------------------------------------------
-- insert into public.tr_boutiques (slug, name, legal_name, description, status)
-- values ('demo-boutique', 'Demo Boutique', 'Demo Boutique Ltd.', 'Sandbox storefront', 'verified');
--
-- insert into public.tr_products (boutique_id, title, price_kurus, size, category, status)
-- select id, 'Vintage Blazer', 125000, 'M', 'outerwear', 'available'
-- from public.tr_boutiques where slug = 'demo-boutique';
