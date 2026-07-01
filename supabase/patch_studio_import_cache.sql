-- Studio import cache — reuse segmented/raw assets per curator (skip repeat Photoroom/Gemini)
-- Run after patch_studio_drafts.sql

create table if not exists public.studio_import_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_hash text not null check (char_length(source_hash) = 64),
  pipeline text not null check (pipeline in ('segmented', 'raw')),
  asset_url text not null,
  storage_path text not null,
  product_name text,
  category text,
  brand text,
  item_id_slug text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  source_url text,
  source_filename text,
  created_at timestamptz not null default timezone('utc', now()),
  last_used_at timestamptz not null default timezone('utc', now()),
  unique (user_id, source_hash, pipeline)
);

create index if not exists studio_import_cache_user_last_used_idx
  on public.studio_import_cache (user_id, last_used_at desc);

alter table public.studio_import_cache enable row level security;

create policy "Studio import cache viewable by owner"
  on public.studio_import_cache for select
  using (auth.uid() = user_id);

create policy "Studio import cache insertable by owner"
  on public.studio_import_cache for insert
  with check (auth.uid() = user_id);

create policy "Studio import cache updatable by owner"
  on public.studio_import_cache for update
  using (auth.uid() = user_id);

create policy "Studio import cache deletable by owner"
  on public.studio_import_cache for delete
  using (auth.uid() = user_id);
