-- Fix: after revoke SELECT on tr_boutiques from anon (public view patch),
-- product RLS still did EXISTS (SELECT … FROM tr_boutiques …).
-- Anon cannot read that table → every product row fails the policy →
-- storefront catalog is empty while owner panel (service role) still shows SKUs.
--
-- Run in Supabase SQL Editor on the production project.

drop policy if exists "TR products public read" on public.tr_products;

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

-- Smoke (as anon-equivalent): should return > 0 for Lila when products are available
-- select count(*) from public.tr_products p
-- join public.tr_boutiques_public b on b.id = p.boutique_id
-- where b.slug = 'lilabutik' and p.status in ('available', 'sold');
