-- Restrict anon/authenticated from reading sensitive boutique columns
-- (iban, contact_*, shipping_address, return_address, etc.).
-- App public reads should use public.tr_boutiques_public (or service role).
-- Run manually in Supabase SQL editor.
-- If adding catalog_profile to an existing view:
--   1) DROP dependent RLS policy on tr_products (references this view)
--   2) DROP VIEW (CREATE OR REPLACE cannot insert mid-list — 42P16)
--   3) CREATE VIEW + recreate policy

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

-- Remove broad table SELECT for client roles (service_role unaffected).
drop policy if exists "TR boutiques public read verified" on public.tr_boutiques;

revoke select on public.tr_boutiques from anon, authenticated;
