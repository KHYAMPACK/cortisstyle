-- Customer reference photo + line customization for print-on-demand orders.
-- Run in Supabase SQL Editor after patch_tr_order_items_size.sql

alter table public.tr_order_items
  add column if not exists reference_image_url text,
  add column if not exists customization jsonb;

comment on column public.tr_order_items.reference_image_url is
  'Customer-uploaded source photo for custom_art orders; snapshot at purchase time.';
comment on column public.tr_order_items.customization is
  'Optional JSON e.g. styleOption, referenceId for custom_art line items.';
