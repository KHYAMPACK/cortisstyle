-- Category system keys: a stable key a vertical can attach meaning to, so a category
-- can be renamed (name or slug) without breaking what the vertical does with it
-- (fashion Beden & Kategori plan, milestone K1).
-- See docs/fashion-beden-kategori-plan.md.
--
--   tr_categories.system_key   text null, unique per boutique when set. "Hazır
--                              kategorileri içe aktar" sets it to the built-in id
--                              (elbise, ust-giyim, takim…) on each imported category;
--                              categories the owner creates have none. Core never
--                              interprets it; the fashion module reads it to know that
--                              a category (or one of its ancestors) is a dress, a
--                              two-piece set, and so on.
--
-- Nothing on the storefront reads this column. Importing categories doesn't switch a
-- boutique's category_mode, and nothing public reads tr_categories while a boutique is
-- in 'legacy' mode (sitemap and /kategori/<slug> both check the mode).
--
-- Needs patch_categories.sql first. Safe to apply before or after the app version that
-- uses it (the import reports the missing column by name). Idempotent.
--
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

alter table public.tr_categories
  add column if not exists system_key text null;

create unique index if not exists tr_categories_boutique_system_key_idx
  on public.tr_categories (boutique_id, system_key)
  where system_key is not null;

comment on column public.tr_categories.system_key is
  'Stable key a vertical attaches meaning to (fashion: elbise, ust-giyim, takim…); set by the category import, null for owner-made categories. Core never interprets it.';

commit;
