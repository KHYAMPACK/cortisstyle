-- Homepage archive stream + checkout priority validation funnels
-- Run in Supabase SQL Editor

create table if not exists public.archive_stream_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'archive-extension',
  created_at timestamptz not null default timezone('utc', now()),
  constraint archive_stream_signups_email_unique unique (email)
);

create table if not exists public.checkout_priority_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  look_id text,
  source text not null default 'checkout-priority',
  created_at timestamptz not null default timezone('utc', now()),
  constraint checkout_priority_signups_email_unique unique (email)
);

create index if not exists checkout_priority_signups_look_id_idx
  on public.checkout_priority_signups (look_id);

create table if not exists public.purchase_intent_events (
  id uuid primary key default gen_random_uuid(),
  look_id text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists purchase_intent_events_look_id_idx
  on public.purchase_intent_events (look_id);

create index if not exists purchase_intent_events_created_at_idx
  on public.purchase_intent_events (created_at desc);

create table if not exists public.purchase_intent_stats (
  look_id text primary key,
  click_count bigint not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.archive_stream_signups enable row level security;
alter table public.checkout_priority_signups enable row level security;
alter table public.purchase_intent_events enable row level security;
alter table public.purchase_intent_stats enable row level security;

-- Profile / member access waitlist (/notify)
create table if not exists public.member_notify_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'member-notify',
  created_at timestamptz not null default timezone('utc', now()),
  constraint member_notify_signups_email_unique unique (email)
);

create index if not exists member_notify_signups_created_at_idx
  on public.member_notify_signups (created_at desc);

alter table public.member_notify_signups enable row level security;

-- Inserts via server API (service role) only.
