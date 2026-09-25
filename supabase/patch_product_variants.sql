-- Product variants: which variant types a Gelişmiş product uses, and its sellable
-- variants (product upload foundation, milestone M7b).
-- See docs/product-upload-foundation-plan.md, section 8.
--
--   tr_product_options    the option types a product uses, in order (Renk, Beden…).
--                         A type that a product uses cannot be deleted.
--   tr_product_variants   one row per combination of option values. option_value_ids
--                         holds one tr_variant_type_values id per option, in the order
--                         of tr_product_options.sort_order; the combination is unique
--                         per product. price_kurus null = the variant inherits the
--                         product's price. images is a subset of the product's images.
--                         tr_products.stock is kept by the app as the sum of the active
--                         variants' stock.
--
-- Apply patch_variant_types.sql first (this references tr_variant_types).
--
-- Both tables are service-role only for now (RLS on, no policies): nothing on the
-- storefront reads variants yet. When the shop starts selling variants (M7c) a public
-- read is added then. Safe to apply before or after the app version that uses it (the
-- app treats a missing table as "no variants"; saving variants without it reports the
-- missing patch). Idempotent.
--
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

create table if not exists public.tr_product_options (
  product_id uuid not null references public.tr_products (id) on delete cascade,
  type_id uuid not null references public.tr_variant_types (id) on delete restrict,
  sort_order integer not null default 0,
  primary key (product_id, type_id)
);

create index if not exists tr_product_options_type_idx
  on public.tr_product_options (type_id);

create table if not exists public.tr_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.tr_products (id) on delete cascade,
  option_value_ids uuid[] not null
    check (cardinality(option_value_ids) between 1 and 3),
  sku text check (sku is null or char_length(sku) <= 64),
  barcode text check (barcode is null or char_length(barcode) <= 64),
  price_kurus integer check (price_kurus is null or price_kurus > 0),
  stock integer not null default 0 check (stock >= 0),
  images jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- One variant per combination of values, per product.
create unique index if not exists tr_product_variants_combination_key
  on public.tr_product_variants (product_id, option_value_ids);

create index if not exists tr_product_variants_product_idx
  on public.tr_product_variants (product_id, sort_order);

-- "Which products use this value?" (blocks deleting a value that is in use).
create index if not exists tr_product_variants_values_idx
  on public.tr_product_variants using gin (option_value_ids);

alter table public.tr_product_options enable row level security;
alter table public.tr_product_variants enable row level security;

-- No policies on purpose: only the service role (owner APIs) may read or write.
revoke all on public.tr_product_options from anon, authenticated;
revoke all on public.tr_product_variants from anon, authenticated;

comment on table public.tr_product_options is
  'The variant types a product uses, in order. Service-role only for now.';
comment on table public.tr_product_variants is
  'A product''s variants, one per combination of option values. Service-role only for now.';

commit;
