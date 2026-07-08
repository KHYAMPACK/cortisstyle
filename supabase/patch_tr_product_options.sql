-- Product size + color options for storefront pickers.
-- Run after patch_tr_marketplace.sql

alter table public.tr_products
  add column if not exists sizes jsonb not null default '[]'::jsonb,
  add column if not exists colors jsonb not null default '[]'::jsonb;

comment on column public.tr_products.sizes is
  'Available sizes, e.g. ["S","M","L","XL"] or ["36","38"].';

comment on column public.tr_products.colors is
  'Color options, e.g. [{"name":"Siyah","hex":"#1a1a1a"}].';
