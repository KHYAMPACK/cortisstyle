-- Boutique customers: a real record per person per boutique, instead of deriving
-- "customers" from orders on the fly. Idempotent — safe to run more than once.
--
-- Apply BEFORE deploying the customers module. The app tolerates the patch being
-- absent for checkout (a sale is never blocked by the customer step), but the
-- Müşteriler pages need this table.

-- 1. The table -----------------------------------------------------------------

create table if not exists public.tr_customers (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references public.tr_boutiques(id) on delete cascade,
  name text not null,
  -- Always stored lower-cased; a customer is identified by boutique + email.
  email text not null,
  phone text,
  note text,
  -- [{ id, title, name, line1, line2, district, city, postalCode, country, isDefault }]
  addresses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint tr_customers_email_lowercase check (email = lower(email)),
  constraint tr_customers_boutique_email_key unique (boutique_id, email)
);

create index if not exists tr_customers_boutique_created_idx
  on public.tr_customers (boutique_id, created_at desc);

-- Personal data: service-role only. No policies, and no grants to anon/authenticated.
alter table public.tr_customers enable row level security;
revoke all on public.tr_customers from anon, authenticated;

comment on table public.tr_customers is
  'Boutique customers (personal data). Service-role only — never grant anon/authenticated access.';

-- 2. Orders point at their customer ---------------------------------------------
-- Orders keep their own copy of name / email / phone, so deleting or editing a
-- customer never rewrites history.

alter table public.tr_orders
  add column if not exists customer_id uuid
  references public.tr_customers(id) on delete set null;

create index if not exists tr_orders_customer_id_idx
  on public.tr_orders (customer_id) where customer_id is not null;

-- 3. Backfill from existing orders ----------------------------------------------
-- One customer per boutique + email, using the most recent order's details, the
-- first order's date as "created", and that order's address as the first address.

with order_boutiques as (
  select distinct o.id as order_id, i.boutique_id
  from public.tr_orders o
  join public.tr_order_items i on i.order_id = o.id
  where trim(o.customer_email) <> ''
),
ranked as (
  select
    ob.boutique_id,
    lower(trim(o.customer_email)) as email,
    o.customer_name,
    o.customer_phone,
    o.shipping_address,
    row_number() over (
      partition by ob.boutique_id, lower(trim(o.customer_email))
      order by o.created_at desc
    ) as rn,
    min(o.created_at) over (
      partition by ob.boutique_id, lower(trim(o.customer_email))
    ) as first_at
  from order_boutiques ob
  join public.tr_orders o on o.id = ob.order_id
)
insert into public.tr_customers (boutique_id, name, email, phone, addresses, created_at)
select
  boutique_id,
  customer_name,
  email,
  nullif(trim(customer_phone), ''),
  case
    when jsonb_typeof(shipping_address) = 'object' and shipping_address ? 'line1'
    then jsonb_build_array(jsonb_build_object(
      'id', gen_random_uuid()::text,
      'title', 'Teslimat adresi',
      'name', customer_name,
      'line1', coalesce(shipping_address->>'line1', ''),
      'line2', coalesce(shipping_address->>'line2', ''),
      'district', coalesce(shipping_address->>'district', ''),
      'city', coalesce(shipping_address->>'city', ''),
      'postalCode', coalesce(shipping_address->>'postalCode', ''),
      'country', coalesce(shipping_address->>'country', 'TR'),
      'isDefault', true
    ))
    else '[]'::jsonb
  end,
  first_at
from ranked
where rn = 1
on conflict (boutique_id, email) do nothing;

-- Link every order that isn't linked yet to its customer.
update public.tr_orders o
set customer_id = c.id
from public.tr_customers c
join (
  select distinct o2.id as order_id, i.boutique_id
  from public.tr_orders o2
  join public.tr_order_items i on i.order_id = o2.id
) ob on ob.boutique_id = c.boutique_id
where ob.order_id = o.id
  and c.email = lower(trim(o.customer_email))
  and o.customer_id is null;
