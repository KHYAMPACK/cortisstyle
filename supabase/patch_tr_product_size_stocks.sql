-- Per-size stock map for boutique products.
-- `stock` remains the total (sum of size_stocks, or a single count when sizes is empty).
-- Run after patch_tr_product_stock.sql

alter table public.tr_products
  add column if not exists size_stocks jsonb not null default '{}'::jsonb;

comment on column public.tr_products.size_stocks is
  'Map of size label → units available. Empty when product has no sizes; then stock is the single count.';
