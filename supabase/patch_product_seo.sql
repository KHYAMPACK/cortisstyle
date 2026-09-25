-- Product SEO: slug, per-product SEO overrides, and old-slug redirects
-- (product upload foundation, milestone M2). See docs/product-upload-foundation-plan.md.
--
--   tr_products.slug   optional, unique per boutique. When set, the product page also
--                      answers at /urun/<slug> (the id URL keeps working). Existing
--                      products stay NULL, so nothing about their URLs changes.
--   tr_products.seo    { title, description, noindex, canonical } overrides.
--   tr_slug_redirects  a slug a product used to have -> that product, so renaming a
--                      slug never breaks a shared or indexed link. Service role only.
--
-- Safe to apply before or after the app version that uses it: the app tolerates the
-- columns and table being absent (products just have no slug). Idempotent.
--
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

alter table public.tr_products
  add column if not exists slug text,
  add column if not exists seo jsonb not null default '{}'::jsonb;

alter table public.tr_products
  drop constraint if exists tr_products_slug_format_check;
-- Lowercase words joined by single hyphens, at most 185 characters, and never
-- shaped like a product id (the product page tells ids and slugs apart by shape).
alter table public.tr_products
  add constraint tr_products_slug_format_check
  check (
    slug is null
    or (
      char_length(slug) <= 185
      and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      and slug !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    )
  );

create unique index if not exists tr_products_boutique_slug_key
  on public.tr_products (boutique_id, slug)
  where slug is not null;

comment on column public.tr_products.slug is
  'Optional URL slug, unique per boutique. NULL = the product is addressed by id only.';
comment on column public.tr_products.seo is
  'Owner SEO overrides: title, description, noindex, canonical (path). {} = defaults.';

create table if not exists public.tr_slug_redirects (
  boutique_id uuid not null references public.tr_boutiques (id) on delete cascade,
  entity_type text not null check (entity_type in ('product', 'category')),
  old_slug text not null,
  entity_id uuid not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (boutique_id, entity_type, old_slug)
);

create index if not exists tr_slug_redirects_entity_idx
  on public.tr_slug_redirects (entity_type, entity_id);

alter table public.tr_slug_redirects enable row level security;

-- No policies on purpose: only the service role (server code) reads or writes.
revoke all on public.tr_slug_redirects from anon, authenticated;

comment on table public.tr_slug_redirects is
  'Old slug -> current entity, so a renamed slug still resolves. Service-role only.';

commit;
