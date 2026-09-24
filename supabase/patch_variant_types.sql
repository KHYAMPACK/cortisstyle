-- Variant types: the named options a boutique defines once (Renk, Beden, Boyut…) and
-- their values (product upload foundation, milestone M7a).
-- See docs/product-upload-foundation-plan.md, section 8.
--
--   tr_variant_types         one per option: name, how its values are shown to the
--                            shopper ('list' = text chips, 'swatch' = colour and/or
--                            picture per value), display order.
--   tr_variant_type_values   the option's values, in order; a swatch value carries a
--                            hex colour and/or an image URL.
--
-- Nothing reads these yet except the panel (Ürünler > Tanımlamalar > Varyant Türleri):
-- Gelişmiş products (M7b) and the storefront (M7c) come later, so this changes nothing
-- for any boutique's shop. Value ids stay stable when a value is renamed, because
-- variants will reference them.
--
-- Both tables are service-role only (RLS on, no policies, nothing granted to anon or
-- authenticated), like tr_categories. Safe to apply before or after the app version
-- that uses it (the app reports a missing table instead of failing). Idempotent.
--
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

create table if not exists public.tr_variant_types (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references public.tr_boutiques (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  selection_style text not null default 'list'
    check (selection_style in ('list', 'swatch')),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- One "Renk" per boutique, whatever the letter case.
create unique index if not exists tr_variant_types_boutique_name_key
  on public.tr_variant_types (boutique_id, lower(name));

create index if not exists tr_variant_types_boutique_idx
  on public.tr_variant_types (boutique_id, sort_order);

create table if not exists public.tr_variant_type_values (
  id uuid primary key default gen_random_uuid(),
  type_id uuid not null references public.tr_variant_types (id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 40),
  hex text check (hex is null or hex ~* '^#[0-9a-f]{6}$'),
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- One "Kırmızı" per type, whatever the letter case.
create unique index if not exists tr_variant_type_values_type_label_key
  on public.tr_variant_type_values (type_id, lower(label));

create index if not exists tr_variant_type_values_type_idx
  on public.tr_variant_type_values (type_id, sort_order);

alter table public.tr_variant_types enable row level security;
alter table public.tr_variant_type_values enable row level security;

-- No policies on purpose: only the service role (owner APIs) may read or write.
revoke all on public.tr_variant_types from anon, authenticated;
revoke all on public.tr_variant_type_values from anon, authenticated;

comment on table public.tr_variant_types is
  'A boutique''s variant types (Renk, Beden…). Service-role only.';
comment on table public.tr_variant_type_values is
  'Values of a variant type, in display order. Ids are stable across renames. Service-role only.';

commit;
