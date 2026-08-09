-- Buyer invoice party on orders + offline invoice registry (GİB later).
-- Seller = boutique (not platform). No fake GİB rows.

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'tr_invoice_type'
  ) then
    create type public.tr_invoice_type as enum (
      'individual',
      'corporate'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'tr_invoice_status'
  ) then
    create type public.tr_invoice_status as enum (
      'draft',
      'issued_offline',
      'void'
    );
  end if;
end
$$;

alter table public.tr_orders
  add column if not exists invoice_type public.tr_invoice_type
  not null default 'individual';

alter table public.tr_orders
  add column if not exists buyer_tax_id text;

alter table public.tr_orders
  add column if not exists buyer_tax_office text;

alter table public.tr_orders
  add column if not exists buyer_title text;

comment on column public.tr_orders.invoice_type is
  'individual (bireysel) or corporate (kurumsal) invoice party.';
comment on column public.tr_orders.buyer_tax_id is
  'TCKN (11) or VKN (10); optional for individual until GİB.';
comment on column public.tr_orders.buyer_tax_office is
  'Vergi dairesi for corporate invoices.';
comment on column public.tr_orders.buyer_title is
  'Company unvan for corporate invoices.';

create table if not exists public.tr_invoices (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references public.tr_boutiques (id) on delete cascade,
  order_id uuid not null references public.tr_orders (id) on delete cascade,
  status public.tr_invoice_status not null default 'draft',
  buyer_name text not null,
  buyer_email text not null,
  invoice_type public.tr_invoice_type not null default 'individual',
  buyer_tax_id text,
  buyer_tax_office text,
  buyer_title text,
  total_kurus integer not null check (total_kurus >= 0),
  line_summary jsonb not null default '[]'::jsonb,
  external_invoice_no text,
  issued_at timestamptz,
  notes text,
  pdf_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (boutique_id, order_id)
);

create index if not exists tr_invoices_boutique_created_idx
  on public.tr_invoices (boutique_id, created_at desc);

create index if not exists tr_invoices_order_id_idx
  on public.tr_invoices (order_id);

drop trigger if exists tr_invoices_set_updated_at on public.tr_invoices;
create trigger tr_invoices_set_updated_at
before update on public.tr_invoices
for each row execute function public.tr_set_updated_at();

alter table public.tr_invoices enable row level security;

comment on table public.tr_invoices is
  'Boutique-scoped invoice registry. issued_offline = cut outside app until GİB.';
