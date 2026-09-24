-- Drops tr_boutiques.home_layout. Every boutique renders the editorial shell now
-- (the Cadde marketplace / "default" layout was retired), so nothing reads or
-- writes this column any more.
--
-- ORDER MATTERS: apply this AFTER the app version that stopped selecting
-- home_layout is deployed. Before that deploy, the storefront still selects the
-- column from tr_boutiques_public and would fail as soon as it disappears.
--
-- tr_boutiques_public selects home_layout, so the view has to be dropped and
-- recreated without it. The "TR products public read" policy on tr_products
-- depends on that view, so it is dropped and recreated around it. Everything runs
-- in one transaction so anon reads of products are never left without the policy
-- if any step fails.
--
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

drop policy if exists "TR products public read" on public.tr_products;

drop view if exists public.tr_boutiques_public;

-- Also drops the tr_boutiques_home_layout_check constraint.
alter table public.tr_boutiques drop column if exists home_layout;

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

commit;
