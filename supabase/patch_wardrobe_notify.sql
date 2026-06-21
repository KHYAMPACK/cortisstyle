-- Wardrobe SS26 notify list (anonymous email capture)
-- Run in Supabase SQL Editor after schema.sql

create table if not exists public.wardrobe_notify_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'wardrobe-coming-soon',
  created_at timestamptz not null default timezone('utc', now()),
  constraint wardrobe_notify_signups_email_unique unique (email)
);

create index if not exists wardrobe_notify_signups_created_at_idx
  on public.wardrobe_notify_signups (created_at desc);

alter table public.wardrobe_notify_signups enable row level security;

-- Inserts only via API route (service role) — no public select/insert policies.
