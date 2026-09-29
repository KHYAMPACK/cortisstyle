-- Discount campaigns (İndirimler): automatic (no-code) discounts and discount-code
-- campaigns, replacing the old coupon MVP. `patch_tr_discount_codes.sql` was never
-- applied to production, so this ships clean — no migration of old rows.
--
--   tr_discount_campaigns        one campaign: kind decides how it is triggered.
--                                'automatic' applies itself when a cart matches;
--                                'code' only applies when the shopper enters one of
--                                its tr_discount_campaign_codes. discount_type is
--                                'percent' | 'fixed' | 'free_shipping' (İndirim Türü;
--                                X Al Y Kazan is not modeled). Scope and requirements
--                                (Koşullar, Gereksinimler) are columns here plus the
--                                tr_discount_campaign_products join table for
--                                "Belirli Ürünler". usage_limit_total /
--                                usage_limit_per_customer are the campaign's own
--                                Kullanım Limitleri — meaningful for 'automatic' only;
--                                a 'code' campaign limits each of its codes instead.
--   tr_discount_campaign_products the product scope when scope_all = false.
--   tr_discount_campaign_codes    the Kuponlar tab's rows: one or many redeemable
--                                codes per 'code' campaign, each with its own usage
--                                limits (a custom code, or one of a generated batch).
--                                Per-customer usage is counted from tr_orders
--                                (customer_id/customer_email + discount_code), not
--                                stored here — no new usage-log table needed.
--
-- Both tr_discount_campaigns and tr_discount_campaign_codes are service-role only,
-- like tr_categories / tr_variant_types (RLS on, no policies, nothing granted to
-- anon or authenticated) — the storefront does not read them directly; checkout
-- resolves a cart's discount server-side. Safe to apply before or after the app
-- version that uses it. Idempotent.
--
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

create table if not exists public.tr_discount_campaigns (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references public.tr_boutiques (id) on delete cascade,
  kind text not null check (kind in ('automatic', 'code')),
  title text not null check (char_length(title) between 1 and 80),
  discount_type text not null check (discount_type in ('percent', 'fixed', 'free_shipping')),
  percent_off integer check (percent_off is null or (percent_off > 0 and percent_off <= 100)),
  amount_off_kurus integer check (amount_off_kurus is null or amount_off_kurus > 0),
  -- Koşullar: every product, or the specific ones in tr_discount_campaign_products.
  scope_all boolean not null default true,
  include_sale_items boolean not null default false,
  -- Gereksinimler: each pair is optional (both null = no requirement).
  min_subtotal_kurus integer check (min_subtotal_kurus is null or min_subtotal_kurus >= 0),
  max_subtotal_kurus integer check (max_subtotal_kurus is null or max_subtotal_kurus >= 0),
  min_items integer check (min_items is null or min_items >= 1),
  max_items integer check (max_items is null or max_items >= 1),
  -- Ayarlar.
  stackable boolean not null default false,
  -- Kullanım Limitleri (automatic campaigns only; a code campaign limits its codes).
  usage_limit_total integer check (usage_limit_total is null or usage_limit_total > 0),
  usage_limit_per_customer integer check (usage_limit_per_customer is null or usage_limit_per_customer > 0),
  used_count integer not null default 0 check (used_count >= 0),
  -- Aktif Tarihler.
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint tr_discount_campaigns_rate_chk check (
    (discount_type = 'percent' and percent_off is not null and amount_off_kurus is null)
    or (discount_type = 'fixed' and amount_off_kurus is not null and percent_off is null)
    or (discount_type = 'free_shipping' and percent_off is null and amount_off_kurus is null)
  ),
  constraint tr_discount_campaigns_subtotal_range_chk check (
    min_subtotal_kurus is null or max_subtotal_kurus is null or min_subtotal_kurus <= max_subtotal_kurus
  ),
  constraint tr_discount_campaigns_items_range_chk check (
    min_items is null or max_items is null or min_items <= max_items
  ),
  constraint tr_discount_campaigns_dates_chk check (
    starts_at is null or ends_at is null or starts_at <= ends_at
  )
);

create index if not exists tr_discount_campaigns_boutique_idx
  on public.tr_discount_campaigns (boutique_id, kind, active);

create table if not exists public.tr_discount_campaign_products (
  campaign_id uuid not null references public.tr_discount_campaigns (id) on delete cascade,
  product_id uuid not null references public.tr_products (id) on delete cascade,
  primary key (campaign_id, product_id)
);

create table if not exists public.tr_discount_campaign_codes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.tr_discount_campaigns (id) on delete cascade,
  -- Denormalized for a fast, join-free lookup at checkout and the (boutique, code) uniqueness.
  boutique_id uuid not null references public.tr_boutiques (id) on delete cascade,
  code text not null check (char_length(code) between 1 and 50),
  usage_limit_total integer check (usage_limit_total is null or usage_limit_total > 0),
  usage_limit_per_customer integer check (usage_limit_per_customer is null or usage_limit_per_customer > 0),
  used_count integer not null default 0 check (used_count >= 0),
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint tr_discount_campaign_codes_boutique_code_uidx unique (boutique_id, code)
);

create index if not exists tr_discount_campaign_codes_campaign_idx
  on public.tr_discount_campaign_codes (campaign_id);

alter table public.tr_discount_campaigns enable row level security;
alter table public.tr_discount_campaign_products enable row level security;
alter table public.tr_discount_campaign_codes enable row level security;

-- No policies on purpose: only the service role (owner APIs, checkout) may read or write.
revoke all on public.tr_discount_campaigns from anon, authenticated;
revoke all on public.tr_discount_campaign_products from anon, authenticated;
revoke all on public.tr_discount_campaign_codes from anon, authenticated;

drop trigger if exists tr_discount_campaigns_set_updated_at on public.tr_discount_campaigns;
create trigger tr_discount_campaigns_set_updated_at
before update on public.tr_discount_campaigns
for each row execute function public.tr_set_updated_at();

comment on table public.tr_discount_campaigns is
  'Automatic (no-code) and discount-code campaigns. Service-role only.';
comment on table public.tr_discount_campaign_products is
  'A campaign''s product scope when scope_all = false. Service-role only.';
comment on table public.tr_discount_campaign_codes is
  'A code campaign''s redeemable codes, each with its own usage limits. Service-role only.';

commit;
