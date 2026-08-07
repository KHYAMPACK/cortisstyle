-- Owner device Web Push subscriptions (panel PWA notifications).
create table if not exists public.tr_owner_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references public.tr_boutiques (id) on delete cascade,
  owner_user_id uuid not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tr_owner_push_subscriptions_endpoint_uidx unique (endpoint)
);

create index if not exists tr_owner_push_subscriptions_boutique_id_idx
  on public.tr_owner_push_subscriptions (boutique_id);

create index if not exists tr_owner_push_subscriptions_owner_user_id_idx
  on public.tr_owner_push_subscriptions (owner_user_id);

alter table public.tr_owner_push_subscriptions enable row level security;

drop trigger if exists tr_owner_push_subscriptions_set_updated_at
  on public.tr_owner_push_subscriptions;
create trigger tr_owner_push_subscriptions_set_updated_at
before update on public.tr_owner_push_subscriptions
for each row execute function public.tr_set_updated_at();

comment on table public.tr_owner_push_subscriptions is
  'Web Push endpoints for boutique owner panel PWA (service-role writes).';
