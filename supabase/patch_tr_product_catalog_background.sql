-- Optional catalog backdrop behind cutout product photos (one per product).
alter table public.tr_products
  add column if not exists catalog_background_id text;

comment on column public.tr_products.catalog_background_id is
  'Premade catalog background id from TR_CATALOG_BACKGROUNDS (e.g. studio-white).';
