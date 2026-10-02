-- Product kinds and their fields (foundation plan, milestone F2).
-- See docs/foundation-no-hardcode-plan.md, section F2.
--
--   tr_attribute_definitions    a boutique's Özellikler fields (Kumaş, Yaka, Boy…): the
--                               key the value is stored under in tr_products.features,
--                               a label, how it is filled in ('text', 'textarea',
--                               'choice'), the options of a choice, and whether a
--                               choice also takes a typed value.
--   tr_product_kinds            a boutique's product kinds (Elbise, Pantolon, Takım…):
--                               name, the variant types a new product starts with,
--                               the category pre-selected for it, and system_key (the
--                               starter template's id, like tr_categories.system_key).
--   tr_product_kind_attributes  which fields a kind has, in order, with an optional
--                               narrower option list (Boy for a dress: Mini…Maxi).
--   tr_products.kind_id         the product's kind; null = not set.
--
-- Nothing on the storefront reads these. The panel lists them (Ürünler > Tanımlamalar >
-- Ürün türleri / Özellikler) and shows a product's kind in the Ürünler list; the editor
-- starts using them in F3. Product values stay in tr_products.features, so no product
-- data moves.
--
-- The three tables are service-role only (RLS on, no policies), like tr_categories.
-- Safe to apply before or after the app version that uses it (the app reports a
-- missing table instead of failing). Idempotent.
--
-- Needs patch_categories.sql and patch_variant_types.sql first.
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

create table if not exists public.tr_attribute_definitions (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references public.tr_boutiques (id) on delete cascade,
  key text not null check (key ~ '^[a-z][a-zA-Z0-9]{0,39}$'),
  label text not null check (char_length(btrim(label)) between 1 and 40),
  input text not null default 'text' check (input in ('text', 'textarea', 'choice')),
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  allow_custom boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- The key is where values live in tr_products.features: one per boutique.
create unique index if not exists tr_attribute_definitions_boutique_key_key
  on public.tr_attribute_definitions (boutique_id, key);

create unique index if not exists tr_attribute_definitions_boutique_label_key
  on public.tr_attribute_definitions (boutique_id, lower(label));

create table if not exists public.tr_product_kinds (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references public.tr_boutiques (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  system_key text null,
  default_option_type_ids uuid[] not null default '{}',
  suggested_category_id uuid null references public.tr_categories (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists tr_product_kinds_boutique_name_key
  on public.tr_product_kinds (boutique_id, lower(name));

create unique index if not exists tr_product_kinds_boutique_system_key
  on public.tr_product_kinds (boutique_id, system_key)
  where system_key is not null;

create table if not exists public.tr_product_kind_attributes (
  kind_id uuid not null references public.tr_product_kinds (id) on delete cascade,
  attribute_id uuid not null references public.tr_attribute_definitions (id) on delete cascade,
  required boolean not null default false,
  -- null = all of the field's options; else the subset this kind offers.
  options jsonb null check (options is null or jsonb_typeof(options) = 'array'),
  sort_order integer not null default 0,
  primary key (kind_id, attribute_id)
);

create index if not exists tr_product_kind_attributes_attribute_idx
  on public.tr_product_kind_attributes (attribute_id);

alter table public.tr_products
  add column if not exists kind_id uuid null
    references public.tr_product_kinds (id) on delete set null;

create index if not exists tr_products_kind_idx
  on public.tr_products (kind_id)
  where kind_id is not null;

alter table public.tr_attribute_definitions enable row level security;
alter table public.tr_product_kinds enable row level security;
alter table public.tr_product_kind_attributes enable row level security;

-- No policies on purpose: only the service role (owner APIs) may read or write.
revoke all on public.tr_attribute_definitions from anon, authenticated;
revoke all on public.tr_product_kinds from anon, authenticated;
revoke all on public.tr_product_kind_attributes from anon, authenticated;

comment on table public.tr_attribute_definitions is
  'A boutique''s product fields (Özellikler). Values live in tr_products.features under key. Service-role only.';
comment on table public.tr_product_kinds is
  'A boutique''s product kinds (Ürün türleri). Service-role only.';
comment on table public.tr_product_kind_attributes is
  'The fields of a product kind, in order; options narrows a choice field. Service-role only.';
comment on column public.tr_products.kind_id is
  'The product''s kind (tr_product_kinds); null = not set.';

commit;
