-- M3: lets checkout record which automatic discount campaigns applied to an order,
-- the same way `discount_code` already records a redeemed code. Needed for two things
-- `resolveAutomaticDiscount` (campaignRules.ts) can't do on its own since it has no
-- database access: (1) burning a campaign's Toplam kullanım limiti only once payment
-- actually succeeds (mirrors `recordDiscountUsageIfNeeded` for codes), and (2) counting
-- a customer's past uses of a campaign for its Müşteri başına kullanım limiti.
--
-- Additive, idempotent, safe before or after the app version that uses it — an order
-- with no automatic campaign applied simply gets an empty array, same as every
-- existing order once this runs.
--
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

alter table public.tr_orders
  add column if not exists discount_campaign_ids uuid[] not null default '{}'::uuid[];

comment on column public.tr_orders.discount_campaign_ids is
  'Automatic discount campaigns (tr_discount_campaigns) applied to this order, for usage-limit counting. Empty for orders with no automatic campaign, all orders before M3, and code-only or no-discount orders.';

create index if not exists tr_orders_discount_campaign_ids_idx
  on public.tr_orders using gin (discount_campaign_ids);

commit;
