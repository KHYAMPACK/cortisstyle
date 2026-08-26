-- Shopper address book (one platform account across boutiques).
-- Logged-in only. Guests still use checkout localStorage.
-- Run in Supabase SQL Editor after profiles / tr_customer_profiles exist.
-- Do not store TCKN/VKN here.

create table if not exists public.tr_customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  recipient_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  district text not null,
  city text not null,
  postal_code text not null,
  country text not null default 'TR',
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists tr_customer_addresses_user_id_idx
  on public.tr_customer_addresses (user_id);

create unique index if not exists tr_customer_addresses_one_default_uidx
  on public.tr_customer_addresses (user_id)
  where is_default;

comment on table public.tr_customer_addresses is
  'Saved delivery addresses for a Cortisstyle auth user. Shared across boutiques; not on profiles.';
comment on column public.tr_customer_addresses.label is
  'Shopper label (Ev, İş, or custom).';
comment on column public.tr_customer_addresses.recipient_name is
  'Name for kargo at the door; may differ from account name.';
comment on column public.tr_customer_addresses.phone is
  'Mobile for kargo contact. Format-checked only; not OTP-verified.';
comment on column public.tr_customer_addresses.is_default is
  'At most one default per user (partial unique index).';

alter table public.tr_customer_addresses enable row level security;

drop policy if exists "TR customer addresses self select" on public.tr_customer_addresses;
create policy "TR customer addresses self select"
  on public.tr_customer_addresses for select
  using (auth.uid() = user_id);

drop policy if exists "TR customer addresses self insert" on public.tr_customer_addresses;
create policy "TR customer addresses self insert"
  on public.tr_customer_addresses for insert
  with check (auth.uid() = user_id);

drop policy if exists "TR customer addresses self update" on public.tr_customer_addresses;
create policy "TR customer addresses self update"
  on public.tr_customer_addresses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "TR customer addresses self delete" on public.tr_customer_addresses;
create policy "TR customer addresses self delete"
  on public.tr_customer_addresses for delete
  using (auth.uid() = user_id);

drop trigger if exists tr_customer_addresses_set_updated_at
  on public.tr_customer_addresses;
create trigger tr_customer_addresses_set_updated_at
before update on public.tr_customer_addresses
for each row execute function public.tr_set_updated_at();

grant select, insert, update, delete on public.tr_customer_addresses to authenticated;
