-- Product types + owner-only product data (product upload foundation, milestone M1).
-- See docs/product-upload-foundation-plan.md.
--
--   tr_products.product_type     which editor a product opens in:
--                                'simple' | 'advanced' | 'fashion'.
--                                Every product that exists today came from the fashion
--                                flows (wizard / takım / toplu), so existing rows become
--                                'fashion'; rows created after this patch default to
--                                'simple' unless the API says otherwise.
--   tr_products.fulfillment_type 'physical' | 'digital'. Informational for now: a digital
--                                product still goes through normal checkout and shipping.
--   tr_product_private           owner-only data (cost price). tr_products has a public
--                                SELECT policy on every column, so anything an owner
--                                should not publish lives in its own table with RLS on
--                                and no policies (service role only), like
--                                tr_boutique_integrations.
--
-- Safe to apply before or after the app version that uses it: the app tolerates the
-- columns/table being absent (it saves without them and reads every product as fashion).
-- Idempotent: re-running does not touch existing values.
--
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tr_products'
      and column_name = 'product_type'
  ) then
    -- Adding the column with default 'fashion' stamps every existing row; the
    -- default is then switched so new rows are 'simple' unless stated.
    alter table public.tr_products
      add column product_type text not null default 'fashion';
    alter table public.tr_products
      alter column product_type set default 'simple';
  end if;
end
$$;

alter table public.tr_products
  add column if not exists fulfillment_type text not null default 'physical';

alter table public.tr_products
  drop constraint if exists tr_products_product_type_check;
alter table public.tr_products
  add constraint tr_products_product_type_check
  check (product_type in ('simple', 'advanced', 'fashion'));

alter table public.tr_products
  drop constraint if exists tr_products_fulfillment_type_check;
alter table public.tr_products
  add constraint tr_products_fulfillment_type_check
  check (fulfillment_type in ('physical', 'digital'));

comment on column public.tr_products.product_type is
  'Editor the product opens in: simple | advanced | fashion (garment flows: AI catalog, size charts, takım).';
comment on column public.tr_products.fulfillment_type is
  'physical | digital. Informational: digital products still use normal checkout and shipping.';

create table if not exists public.tr_product_private (
  product_id uuid primary key references public.tr_products (id) on delete cascade,
  boutique_id uuid not null references public.tr_boutiques (id) on delete cascade,
  cost_price_kurus integer
    check (cost_price_kurus is null or cost_price_kurus >= 0),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists tr_product_private_boutique_idx
  on public.tr_product_private (boutique_id);

alter table public.tr_product_private enable row level security;

-- No policies on purpose: only the service role (owner APIs) may read or write.
revoke all on public.tr_product_private from anon, authenticated;

comment on table public.tr_product_private is
  'Owner-only product data (cost price; later supplier / HS code). Service-role only — never grant anon/authenticated access.';

commit;
