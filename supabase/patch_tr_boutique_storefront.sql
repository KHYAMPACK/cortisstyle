-- White-label storefront fields for editorial boutique sites.
-- Run in Supabase SQL Editor after patch_tr_boutique_brand.sql

alter table public.tr_boutiques
  add column if not exists home_layout text not null default 'default'
    check (home_layout in ('default', 'editorial')),
  add column if not exists custom_domain text,
  add column if not exists editorial_content jsonb;

create unique index if not exists tr_boutiques_custom_domain_uidx
  on public.tr_boutiques (lower(custom_domain))
  where custom_domain is not null and length(trim(custom_domain)) > 0;

comment on column public.tr_boutiques.home_layout is
  'Storefront template: default branded shell or editorial (Maya-style) white-label.';
comment on column public.tr_boutiques.custom_domain is
  'Primary custom host (e.g. pervinsoysal.com). Middleware maps via TR_BOUTIQUE_DOMAINS env too.';
comment on column public.tr_boutiques.editorial_content is
  'JSON homepage/footer modules for editorial layout. Null = code defaults for that boutique.';

-- Customer registration attribution (unified auth, per-boutique source).
create table if not exists public.tr_customer_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  primary_registration_boutique_id uuid references public.tr_boutiques (id) on delete set null,
  primary_registration_slug text,
  primary_registration_host text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tr_customer_profiles is
  'Tracks where a Cortisstyle auth user first registered (boutique host). Primary source is immutable.';

alter table public.tr_customer_profiles enable row level security;

drop policy if exists "TR customer profiles self read" on public.tr_customer_profiles;
create policy "TR customer profiles self read"
  on public.tr_customer_profiles for select
  using (auth.uid() = user_id);
