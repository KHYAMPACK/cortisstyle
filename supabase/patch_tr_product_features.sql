-- Boutique PDP “Ürün özellikleri” (AI-filled on upload, owner-editable).
-- Run after patch_tr_marketplace.sql

alter table public.tr_products
  add column if not exists features jsonb not null default '{}'::jsonb;

comment on column public.tr_products.features is
  'PDP product specs: gender, fit, color, neckHem, fabric, composition.';
