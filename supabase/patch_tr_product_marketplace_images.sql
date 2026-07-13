-- Dual product imagery: originals in `images`, marketplace cutouts in `marketplace_images`.
alter table public.tr_products
  add column if not exists marketplace_images jsonb not null default '[]'::jsonb;
