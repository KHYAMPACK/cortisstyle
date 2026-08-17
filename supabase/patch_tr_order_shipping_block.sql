-- Address-reject gate for live shipping (Lila / Basit).
-- Edit+retry is allowed only when shipping_block = address_rejected
-- and shipping_address_retry_used is still false.

alter table public.tr_orders
  add column if not exists shipping_block text;

alter table public.tr_orders
  add column if not exists shipping_address_retry_used boolean not null default false;

alter table public.tr_orders
  add column if not exists shipping_last_error text;

comment on column public.tr_orders.shipping_block is
  'address_rejected = every eligible carrier refused; owner may edit address once.';
