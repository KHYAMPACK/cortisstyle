-- Persist selected beden on order lines (checkout snapshot).
alter table public.tr_order_items
  add column if not exists size text;

comment on column public.tr_order_items.size is
  'Selected size/beden at purchase time; null when product has no sizes.';
