-- Diagnose / restore public boutique visibility (Lila, Pervin, …).
-- Public storefronts read public.tr_boutiques_public WHERE status = 'verified'.
-- Run in Supabase SQL Editor (production project that matches Vercel NEXT_PUBLIC_SUPABASE_URL).

-- 1) What exists vs what the public view exposes
select slug, status, custom_domain, name
from public.tr_boutiques
order by slug;

select slug, status, custom_domain
from public.tr_boutiques_public
order by slug;

-- 2) If rows exist but are not verified → fix (view filters status = 'verified')
update public.tr_boutiques
set status = 'verified',
    updated_at = now()
where slug in ('lilabutik', 'pervinsoysalbutik')
  and status is distinct from 'verified';

-- 3) If custom domain missing for Lila (middleware also has code fallback)
update public.tr_boutiques
set custom_domain = 'lilaboutiquedenizli.com',
    updated_at = now()
where slug = 'lilabutik'
  and (custom_domain is null or custom_domain = '');

-- 4) Re-check public view
select slug, status, custom_domain
from public.tr_boutiques_public
where slug in ('lilabutik', 'pervinsoysalbutik');

-- 5) If the view is missing / wrong, re-run:
--    supabase/patch_tr_boutiques_public_view.sql
--
-- 6) If SELECT in (1) returns ZERO rows for lilabutik / pervinsoysalbutik,
--    seed via POST /api/tr/admin/seed (see scripts/seed-lilabutik.md) against
--    the SAME Supabase project as production — do not only seed a local/dev project.
