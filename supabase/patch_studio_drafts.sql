-- Lookbook Studio — draft persistence + asset storage
-- Run in Supabase SQL Editor after schema.sql

-- ---------------------------------------------------------------------------
-- Studio drafts (lookbook-studio workspace snapshots)
-- ---------------------------------------------------------------------------
create table if not exists public.studio_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  look_id text not null,
  title text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_drafts_user_id_idx
  on public.studio_drafts (user_id);

create index if not exists studio_drafts_updated_at_idx
  on public.studio_drafts (updated_at desc);

alter table public.studio_drafts enable row level security;

create policy "Studio drafts viewable by owner"
  on public.studio_drafts for select
  using (auth.uid() = user_id);

create policy "Studio drafts insertable by owner"
  on public.studio_drafts for insert
  with check (auth.uid() = user_id);

create policy "Studio drafts updatable by owner"
  on public.studio_drafts for update
  using (auth.uid() = user_id);

create policy "Studio drafts deletable by owner"
  on public.studio_drafts for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Public asset bucket for garment PNGs + mood images (upload via service role)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('studio-assets', 'studio-assets', true)
on conflict (id) do update
  set public = excluded.public;

create policy "Studio assets are publicly readable"
  on storage.objects for select
  using (bucket_id = 'studio-assets');

create policy "Studio assets upload scoped to owner folder"
  on storage.objects for insert
  with check (
    bucket_id = 'studio-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Studio assets update scoped to owner folder"
  on storage.objects for update
  using (
    bucket_id = 'studio-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Studio assets delete scoped to owner folder"
  on storage.objects for delete
  using (
    bucket_id = 'studio-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
