-- Allow deleting products that appear on past orders.
-- Order lines keep title/price snapshots; product_id becomes null.
-- Run in Supabase SQL Editor.

alter table public.tr_order_items
  alter column product_id drop not null;

alter table public.tr_order_items
  drop constraint if exists tr_order_items_product_id_fkey;

alter table public.tr_order_items
  add constraint tr_order_items_product_id_fkey
  foreign key (product_id)
  references public.tr_products (id)
  on delete set null;

comment on column public.tr_order_items.product_id is
  'Nullable so catalog products can be deleted; line title/price remain.';
