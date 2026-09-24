-- Per-boutique shopper shipping fee settings (roadmap P4-T1).
--
-- Until now the fee rules were code constants that only applied to slugs with a
-- carrier integration (lilabutik): 120 TL flat, free at 2+ items. Any other
-- boutique charged no shipping at all. These columns move the rules to the
-- database so every boutique has its own.
--
--   shipping_fee_kurus            flat fee charged per order, integer kuruş.
--                                 0 = no shipping charge shown or collected.
--   free_shipping_min_items       orders with at least this many items ship free.
--   free_shipping_min_subtotal_kurus  orders whose items subtotal reaches this
--                                 (kuruş, before discounts) ship free.
--   Set at most one of the two thresholds; both null = the fee always applies.
--
-- Additive and safe to apply BEFORE the app version that reads these columns is
-- deployed (the currently deployed app simply ignores them). Do NOT deploy that
-- app version first: it selects these columns and every storefront would fail.
--
-- lilabutik keeps exactly her current live rules (120 TL, free at 2+ items).
-- The UPDATE only touches her row while it is still at the default, so
-- re-running this file never overwrites a value she has changed since.
--
-- tr_boutiques_public gets the two fee columns + threshold columns appended
-- (CREATE OR REPLACE VIEW may add columns at the end), because the fee rules are
-- shown to shoppers in the cart, checkout and PDP. Existing columns, the view's
-- security setting, its grants and the tr_products read policy that depends on
-- it are untouched.
--
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

alter table public.tr_boutiques
  add column if not exists shipping_fee_kurus integer not null default 0,
  add column if not exists free_shipping_min_items integer,
  add column if not exists free_shipping_min_subtotal_kurus integer;

alter table public.tr_boutiques
  drop constraint if exists tr_boutiques_shipping_fee_check;
alter table public.tr_boutiques
  add constraint tr_boutiques_shipping_fee_check
  check (shipping_fee_kurus >= 0 and shipping_fee_kurus <= 100000);

alter table public.tr_boutiques
  drop constraint if exists tr_boutiques_free_shipping_min_items_check;
alter table public.tr_boutiques
  add constraint tr_boutiques_free_shipping_min_items_check
  check (
    free_shipping_min_items is null
    or (free_shipping_min_items >= 1 and free_shipping_min_items <= 100)
  );

alter table public.tr_boutiques
  drop constraint if exists tr_boutiques_free_shipping_min_subtotal_check;
alter table public.tr_boutiques
  add constraint tr_boutiques_free_shipping_min_subtotal_check
  check (
    free_shipping_min_subtotal_kurus is null
    or (
      free_shipping_min_subtotal_kurus >= 100
      and free_shipping_min_subtotal_kurus <= 100000000
    )
  );

alter table public.tr_boutiques
  drop constraint if exists tr_boutiques_free_shipping_single_threshold_check;
alter table public.tr_boutiques
  add constraint tr_boutiques_free_shipping_single_threshold_check
  check (
    free_shipping_min_items is null
    or free_shipping_min_subtotal_kurus is null
  );

comment on column public.tr_boutiques.shipping_fee_kurus is
  'Flat shipping fee charged to the shopper per order, in kuruş. 0 = no shipping charge.';
comment on column public.tr_boutiques.free_shipping_min_items is
  'Orders with at least this many items ship free. Null = no item-count threshold. Mutually exclusive with free_shipping_min_subtotal_kurus.';
comment on column public.tr_boutiques.free_shipping_min_subtotal_kurus is
  'Orders whose items subtotal (before discounts, kuruş) reaches this ship free. Null = no amount threshold. Mutually exclusive with free_shipping_min_items.';

-- lilabutik: preserve her live rules (was hardcoded in the app).
update public.tr_boutiques
set shipping_fee_kurus = 12000,
    free_shipping_min_items = 2
where slug = 'lilabutik'
  and shipping_fee_kurus = 0
  and free_shipping_min_items is null
  and free_shipping_min_subtotal_kurus is null;

create or replace view public.tr_boutiques_public
with (security_invoker = false)
as
select
  id,
  slug,
  name,
  legal_name,
  description,
  logo_url,
  whatsapp_phone,
  instagram_handle,
  theme_accent,
  shipping_note,
  exchange_policy,
  physical_address,
  custom_domain,
  editorial_content,
  catalog_profile,
  vergi_no,
  contact_email,
  status,
  created_at,
  updated_at,
  shipping_fee_kurus,
  free_shipping_min_items,
  free_shipping_min_subtotal_kurus
from public.tr_boutiques
where status = 'verified';

commit;
