-- Studio curator roster — only listed users may access Lookbook Studio
-- Run after schema.sql and patch_studio_drafts.sql

create table if not exists public.studio_curators (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email text,
  notes text,
  granted_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_curators_granted_at_idx
  on public.studio_curators (granted_at desc);

alter table public.studio_curators enable row level security;

-- Curators can see their own roster row (used for optional client checks)
create policy "Curators can read own roster row"
  on public.studio_curators for select
  using (auth.uid() = user_id);

-- Inserts/updates/deletes: Supabase SQL Editor or service-role admin tools only.
-- No public write policies.

-- Grant a curator by email (replace the address):
-- insert into public.studio_curators (user_id, email, notes)
-- select id, email, 'Founding curator'
-- from public.profiles
-- where lower(email) = lower('curator@example.com')
-- on conflict (user_id) do nothing;
