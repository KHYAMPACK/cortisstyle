-- Restrict anon/authenticated from reading sensitive boutique columns
-- (iban, contact_*, shipping_address, return_address, etc.).
-- App public reads should use public.tr_boutiques_public (or service role).
-- Run manually in Supabase SQL editor.

create or replace view public.tr_boutiques_public
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
  vergi_no,
  status,
  created_at,
  updated_at
from public.tr_boutiques
where status = 'verified';

comment on view public.tr_boutiques_public is
  'Public-safe boutique columns for anon/authenticated; IBAN/contact/shipping omitted. vergi_no kept for yasal pages.';

grant select on public.tr_boutiques_public to anon, authenticated;

-- Remove broad table SELECT for client roles (service_role unaffected).
drop policy if exists "TR boutiques public read verified" on public.tr_boutiques;

revoke select on public.tr_boutiques from anon, authenticated;
