-- Shopper contact on the platform profile (one account across boutiques).
-- Name + phone collected at boutique signup; not SMS-verified.
-- Run in Supabase SQL Editor after existing profiles table exists.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text;

comment on column public.profiles.first_name is
  'Shopper given name from boutique signup. Shared across tenants.';
comment on column public.profiles.last_name is
  'Shopper family name from boutique signup. Shared across tenants.';
comment on column public.profiles.phone is
  'Shopper mobile digits for kargo contact. Format-checked only; not OTP-verified.';
