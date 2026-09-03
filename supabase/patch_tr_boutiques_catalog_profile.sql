-- Boutique catalog vertical: fashion (default) vs custom_art (print-on-demand tablo).
-- Run in Supabase SQL Editor after patch_tr_boutique_storefront.sql

alter table public.tr_boutiques
  add column if not exists catalog_profile text not null default 'fashion'
    check (catalog_profile in ('fashion', 'custom_art'));

comment on column public.tr_boutiques.catalog_profile is
  'Storefront + panel vertical: fashion = apparel catalog; custom_art = print-on-demand art.';
