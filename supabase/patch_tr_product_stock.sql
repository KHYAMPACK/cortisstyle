-- Product stock quantity for boutique inventory.
-- Run after patch_tr_marketplace.sql

alter table public.tr_products
  add column if not exists stock integer not null default 1
  check (stock >= 0);

comment on column public.tr_products.stock is
  'Units available for sale. Default 1 (unique / single piece).';
