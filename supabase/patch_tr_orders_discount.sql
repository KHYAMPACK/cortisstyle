-- Order-level coupon snapshot (applied at checkout).
alter table public.tr_orders
  add column if not exists discount_code text;

alter table public.tr_orders
  add column if not exists discount_kurus integer not null default 0
  check (discount_kurus >= 0);

comment on column public.tr_orders.discount_code is
  'Coupon code applied at checkout (uppercase), if any.';
comment on column public.tr_orders.discount_kurus is
  'Discount amount in kuruş subtracted from line subtotal before total_kurus.';
