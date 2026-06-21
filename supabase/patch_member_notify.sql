-- Member notify waitlist (/notify — profile button gate)
-- Run in Supabase SQL Editor if patch_funnel_validation.sql was already applied.

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
