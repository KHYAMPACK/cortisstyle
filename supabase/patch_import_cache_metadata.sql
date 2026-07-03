-- Add full garment metadata columns to studio_import_cache
-- so imported garments retain shop links, pricing, display model, etc.
-- Run in Supabase SQL Editor after patch_studio_import_cache.sql

alter table public.studio_import_cache
  add column if not exists shop_url text,
  add column if not exists display_model text,
  add column if not exists est_price_range text,
  add column if not exists budget_alternative_url text;
