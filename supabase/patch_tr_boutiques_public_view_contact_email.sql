-- Fix for Phase 1 step 1 (patch_tr_boutiques_contact_email.sql): the public-safe
-- tr_boutiques_public view was built to exclude every contact_* column as
-- sensitive (contact_name, contact_phone). contact_email is different — it's
-- the storefront-facing override resolveBoutiqueContactEmail() reads, meant to
-- be public. Without this, the storefront read path never saw the column and
-- silently fell back to info@{custom_domain} for every boutique, lilabutik
-- included.
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
  contact_email,
  status,
  created_at,
  updated_at
from public.tr_boutiques
where status = 'verified';

comment on view public.tr_boutiques_public is
  'Public-safe boutique columns for anon/authenticated; IBAN/contact_name/contact_phone/shipping omitted. contact_email is intentionally public (storefront override); vergi_no kept for yasal pages.';

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
