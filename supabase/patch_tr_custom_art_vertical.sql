-- Custom art vertical (catalog_profile + order customization + public view).
-- Run once in Supabase SQL Editor. Safe to re-run (idempotent).

-- 1) Boutique vertical flag
alter table public.tr_boutiques
  add column if not exists catalog_profile text not null default 'fashion'
    check (catalog_profile in ('fashion', 'custom_art'));

comment on column public.tr_boutiques.catalog_profile is
  'Storefront + panel vertical: fashion = apparel catalog; custom_art = print-on-demand art.';

-- 2) Order line customization (customer reference photo)
alter table public.tr_order_items
  add column if not exists reference_image_url text,
  add column if not exists customization jsonb;

comment on column public.tr_order_items.reference_image_url is
  'Customer-uploaded source photo for custom_art orders; snapshot at purchase time.';
comment on column public.tr_order_items.customization is
  'Optional JSON e.g. styleOption, referenceId for custom_art line items.';

-- 3) Refresh public view (exposes catalog_profile to anon reads)
-- Postgres cannot CREATE OR REPLACE when inserting a column mid-list (42P16).
-- The product RLS policy references this view — drop it first (2BP01).
drop policy if exists "TR products public read" on public.tr_products;

drop view if exists public.tr_boutiques_public;

create view public.tr_boutiques_public
with (security_invoker = false)
as
select
  id,
  slug,
  name,
  legal_name,
  description,
  logo_url,
  whatsapp_phone,
  instagram_handle,
  theme_accent,
  shipping_note,
  exchange_policy,
  physical_address,
  home_layout,
  custom_domain,
  editorial_content,
  catalog_profile,
  vergi_no,
  status,
  created_at,
  updated_at
from public.tr_boutiques
where status = 'verified';

comment on view public.tr_boutiques_public is
  'Public-safe boutique columns for anon/authenticated; IBAN/contact/shipping omitted. vergi_no kept for yasal pages.';

grant select on public.tr_boutiques_public to anon, authenticated;

-- Restore product catalog RLS (same as patch_tr_products_public_read_via_view.sql)
create policy "TR products public read"
  on public.tr_products for select
  using (
    status in ('available', 'sold')
    and exists (
      select 1
      from public.tr_boutiques_public b
      where b.id = boutique_id
    )
  );
