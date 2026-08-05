-- Internal AI catalog usage metering (Phase 3). No boutique billing UI in v1.

create table if not exists public.tr_ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid references public.tr_boutiques (id) on delete set null,
  product_id uuid references public.tr_products (id) on delete set null,
  kind text not null
    check (kind in ('packshot', 'tryon', 'bg_removal')),
  provider text not null
    check (provider in ('fashn', 'photoroom')),
  fashn_prediction_id text,
  credits_used numeric,
  status text not null
    check (status in ('succeeded', 'failed', 'not_configured')),
  error text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists tr_ai_usage_events_boutique_created_idx
  on public.tr_ai_usage_events (boutique_id, created_at desc);

create index if not exists tr_ai_usage_events_kind_created_idx
  on public.tr_ai_usage_events (kind, created_at desc);

alter table public.tr_ai_usage_events enable row level security;

comment on table public.tr_ai_usage_events is
  'Internal AI catalog usage log (FASHN/Photoroom). Service-role writes via owner APIs; boutique billing later.';
