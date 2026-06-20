-- Cortis Style — Digital Wardrobe schema
-- Run this in the Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, updated_at)
  values (new.id, new.email, timezone('utc', now()))
  on conflict (id) do update
    set email = excluded.email,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- User wardrobe unlocks
-- ---------------------------------------------------------------------------
create table if not exists public.user_wardrobe (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  look_id text not null,
  unlocked_at timestamptz not null default timezone('utc', now()),
  unique (user_id, look_id)
);

create index if not exists user_wardrobe_user_id_idx
  on public.user_wardrobe (user_id);

-- ---------------------------------------------------------------------------
-- User saved outfit looks (wardrobe builder)
-- ---------------------------------------------------------------------------
create table if not exists public.user_saved_outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  moodword text,
  mood_image_url text,
  slots jsonb not null,
  layout_overrides jsonb,
  saved_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_saved_outfits_user_id_idx
  on public.user_saved_outfits (user_id);

create index if not exists user_saved_outfits_saved_at_idx
  on public.user_saved_outfits (saved_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_wardrobe enable row level security;
alter table public.user_saved_outfits enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Wardrobe rows are viewable by owner"
  on public.user_wardrobe for select
  using (auth.uid() = user_id);

create policy "Wardrobe rows are insertable by owner"
  on public.user_wardrobe for insert
  with check (auth.uid() = user_id);

create policy "Saved outfits are viewable by owner"
  on public.user_saved_outfits for select
  using (auth.uid() = user_id);

create policy "Saved outfits are insertable by owner"
  on public.user_saved_outfits for insert
  with check (auth.uid() = user_id);

create policy "Saved outfits are updatable by owner"
  on public.user_saved_outfits for update
  using (auth.uid() = user_id);

create policy "Saved outfits are deletable by owner"
  on public.user_saved_outfits for delete
  using (auth.uid() = user_id);

-- Optional demo seed (replace USER_UUID after creating an account):
-- insert into public.user_wardrobe (user_id, look_id)
-- values ('USER_UUID', 'look-01');
