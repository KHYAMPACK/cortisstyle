-- Per-boutique carrier shipment on orders (Basit Kargo for Lila; others null).
-- Provider-agnostic column names so the next boutique carrier can reuse them.

alter table public.tr_orders
  add column if not exists shipping_provider text;

alter table public.tr_orders
  add column if not exists shipping_external_id text;

alter table public.tr_orders
  add column if not exists shipping_barcode text;

alter table public.tr_orders
  add column if not exists shipping_carrier_code text;

alter table public.tr_orders
  add column if not exists shipping_carrier_name text;

alter table public.tr_orders
  add column if not exists shipping_tracking_code text;

alter table public.tr_orders
  add column if not exists shipping_status text;

alter table public.tr_orders
  add column if not exists shipping_traces jsonb not null default '[]'::jsonb;

alter table public.tr_orders
  add column if not exists shipping_fee_kurus integer;

create unique index if not exists tr_orders_shipping_external_id_uidx
  on public.tr_orders (shipping_external_id)
  where shipping_external_id is not null;

comment on column public.tr_orders.shipping_provider is
  'Carrier adapter id (e.g. basitkargo). Null = owner ships outside the app.';
