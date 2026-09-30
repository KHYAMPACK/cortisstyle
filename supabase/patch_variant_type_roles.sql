-- Variant type roles: mark a variant type as a size ("Beden") or colour ("Renk") type
-- (fashion Beden & Kategori plan, milestone S1).
-- See docs/fashion-beden-kategori-plan.md.
--
--   tr_variant_types.role   'size' | 'color' | null. The panel's size tables (fashion
--                           product editor, create wizard, batch and takım uploads)
--                           offer the boutique's `size` types instead of the built-in
--                           XS–3XL / 24–52 lists. Core stores the tag; only the fashion
--                           panel interprets it.
--
-- Nothing on the storefront reads this column: products keep storing their own size
-- labels (`tr_products.sizes`, `size_stocks`), so no shop, cart or checkout behaviour
-- changes. A boutique without a size type keeps the built-in lists.
--
-- Needs patch_variant_types.sql first. Safe to apply before or after the app version
-- that uses it (the app reads a missing column as "no role" and reports it by name when
-- a role is saved). Idempotent.
--
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

alter table public.tr_variant_types
  add column if not exists role text null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tr_variant_types_role_check'
  ) then
    alter table public.tr_variant_types
      add constraint tr_variant_types_role_check check (role in ('size', 'color'));
  end if;
end $$;

comment on column public.tr_variant_types.role is
  'size | color | null. A size type''s values are offered by the fashion panel''s size tables; nothing on the storefront reads it.';

commit;
