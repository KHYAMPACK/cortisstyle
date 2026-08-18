-- Opaque WebP copies of marketplace PNG cutouts for boutique storefronts.
-- Cadde / try-on keep marketplace_images (transparent PNG).
alter table public.tr_products
  add column if not exists storefront_images jsonb not null default '[]'::jsonb;

comment on column public.tr_products.storefront_images is
  'Boutique display copies: packshots flattened onto catalog_background_id and encoded as WebP. Parallel to marketplace_images.';
