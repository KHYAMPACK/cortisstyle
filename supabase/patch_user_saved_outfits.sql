-- Patch: user_saved_outfits (safe to re-run)
-- Run in Supabase SQL Editor if outfit saves fail.

create table if not exists public.user_saved_outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  mood_image_url text,
  slots jsonb not null,
  layout_overrides jsonb,
  saved_at timestamptz not null default timezone('utc', now())
);

alter table public.user_saved_outfits
  add column if not exists moodword text;

alter table public.user_saved_outfits
  add column if not exists layout_overrides jsonb;

alter table public.user_saved_outfits enable row level security;

drop policy if exists "Saved outfits are viewable by owner" on public.user_saved_outfits;
create policy "Saved outfits are viewable by owner"
  on public.user_saved_outfits for select
  using (auth.uid() = user_id);

drop policy if exists "Saved outfits are insertable by owner" on public.user_saved_outfits;
create policy "Saved outfits are insertable by owner"
  on public.user_saved_outfits for insert
  with check (auth.uid() = user_id);

drop policy if exists "Saved outfits are updatable by owner" on public.user_saved_outfits;
create policy "Saved outfits are updatable by owner"
  on public.user_saved_outfits for update
  using (auth.uid() = user_id);

drop policy if exists "Saved outfits are deletable by owner" on public.user_saved_outfits;
create policy "Saved outfits are deletable by owner"
  on public.user_saved_outfits for delete
  using (auth.uid() = user_id);

create index if not exists user_saved_outfits_user_id_idx
  on public.user_saved_outfits (user_id);

create index if not exists user_saved_outfits_saved_at_idx
  on public.user_saved_outfits (saved_at desc);
