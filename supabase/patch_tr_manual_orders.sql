-- Manual orders ("Sipariş Oluştur") and their drafts ("Taslaklar"): orders an owner
-- creates in the panel.
--
-- Apply patch_tr_customers.sql first (drafts point at a customer).
--
--   channel         where the order came from. 'storefront' = the shop's checkout
--                   (every existing row), 'manual' = created by the owner in the panel.
--                   A manual order in a card-checkout boutique stays visible while it
--                   is unpaid and can be marked paid by hand — the storefront's unpaid
--                   card holds are hidden and never markable.
--   customer_note   the "Müşteri Notu" the owner typed when creating the order.
--   discount_title  the name of a manual price reduction ("Arkadaş indirimi"). A coupon
--                   uses discount_code instead; at most one of the two is set.
--   tr_order_drafts an unfinished manual order: the editor's whole state as jsonb (lines,
--                   customer, address id, price reduction, shipping fee, note, payment
--                   choice) plus what the Taslaklar list shows. Drafts hold no stock and
--                   no prices — both are looked up when the order is created. Creating
--                   the order deletes its draft.
--
-- Additive and idempotent. Safe to apply before or after the app version that uses it:
-- the shop's checkout never writes these columns (the defaults cover it), and the app
-- only writes them for a manual order.
--
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

alter table public.tr_orders
  add column if not exists channel text not null default 'storefront'
    check (channel in ('storefront', 'manual')),
  add column if not exists customer_note text
    check (customer_note is null or char_length(customer_note) <= 1000),
  add column if not exists discount_title text
    check (discount_title is null or char_length(discount_title) <= 80);

comment on column public.tr_orders.channel is
  'storefront = the shop checkout, manual = created by the owner in the panel.';
comment on column public.tr_orders.customer_note is
  'Note the owner typed when creating a manual order.';
comment on column public.tr_orders.discount_title is
  'Name of a manual price reduction; a coupon uses discount_code instead.';

create table if not exists public.tr_order_drafts (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references public.tr_boutiques (id) on delete cascade,
  -- Kept when the customer is deleted (the name below still identifies the draft).
  customer_id uuid references public.tr_customers (id) on delete set null,
  customer_name text,
  payload jsonb not null,
  total_kurus integer not null default 0 check (total_kurus >= 0),
  item_count integer not null default 0 check (item_count >= 0),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists tr_order_drafts_boutique_idx
  on public.tr_order_drafts (boutique_id, updated_at desc);

-- Owner API only (service role): no policies on purpose.
alter table public.tr_order_drafts enable row level security;
revoke all on public.tr_order_drafts from anon, authenticated;

comment on table public.tr_order_drafts is
  'Unfinished manual orders (Taslaklar). Service-role only.';

commit;
