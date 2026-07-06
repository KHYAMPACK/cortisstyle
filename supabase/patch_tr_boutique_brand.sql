-- Boutique brand + contact fields for branded storefronts (visual layer only).
-- Checkout is platform-wide via TR_CHECKOUT_ENABLED — not per-boutique.
-- Run in Supabase SQL Editor after patch_tr_marketplace.sql

alter table public.tr_boutiques
  add column if not exists whatsapp_phone text,
  add column if not exists instagram_handle text,
  add column if not exists theme_accent text,
  add column if not exists shipping_note text,
  add column if not exists exchange_policy text,
  add column if not exists physical_address text,
  add column if not exists commission_bps integer not null default 1000
    check (commission_bps >= 0 and commission_bps <= 10000);

comment on column public.tr_boutiques.commission_bps is
  'Platform commission in basis points (1000 = 10%). Admin/payout only — not public.';
