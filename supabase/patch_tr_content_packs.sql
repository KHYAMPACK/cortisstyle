-- Lifestyle / on-model AI outputs + Instagram content packs (Phase 3 sell-enablement).

alter table public.tr_products
  add column if not exists lifestyle_images jsonb not null default '[]'::jsonb;

comment on column public.tr_products.lifestyle_images is
  'AI on-model / lifestyle image URLs generated for sell-enablement (content packs + PDP).';

create table if not exists public.tr_content_packs (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references public.tr_boutiques (id) on delete cascade,
  product_id uuid not null references public.tr_products (id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'ready', 'failed')),
  variant_image_urls jsonb not null default '[]'::jsonb,
  formats jsonb not null default '[]'::jsonb,
  caption text not null default '',
  deep_link text not null default '',
  used_ai_lifestyle boolean not null default false,
  error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists tr_content_packs_boutique_id_idx
  on public.tr_content_packs (boutique_id);

create index if not exists tr_content_packs_product_id_idx
  on public.tr_content_packs (product_id);

create index if not exists tr_content_packs_created_at_idx
  on public.tr_content_packs (boutique_id, created_at desc);

alter table public.tr_content_packs enable row level security;

drop trigger if exists tr_content_packs_set_updated_at on public.tr_content_packs;
create trigger tr_content_packs_set_updated_at
before update on public.tr_content_packs
for each row execute function public.tr_set_updated_at();

comment on table public.tr_content_packs is
  'Owner-panel Instagram content packs (stills + caption + deep link). Service-role access via owner APIs.';
