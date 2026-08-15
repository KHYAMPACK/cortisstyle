-- Optional “where did you find us” from boutique signup (after password).
-- Run in Supabase SQL Editor after profiles exists.

alter table public.profiles
  add column if not exists signup_discovery_source text,
  add column if not exists signup_discovery_boutique_slug text;

comment on column public.profiles.signup_discovery_source is
  'Optional shopper answer at boutique signup: instagram | internet | ai | word_of_mouth.';
comment on column public.profiles.signup_discovery_boutique_slug is
  'Boutique slug where the discovery question was answered.';
