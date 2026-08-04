-- Ikas-like fulfillment pipeline on orders (separate from payment_status).
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'tr_fulfillment_status'
  ) then
    create type public.tr_fulfillment_status as enum (
      'created',
      'ready',
      'shipped',
      'delivered',
      'cancelled'
    );
  end if;
end
$$;

alter table public.tr_orders
  add column if not exists fulfillment_status public.tr_fulfillment_status
  not null default 'created';

create index if not exists tr_orders_fulfillment_status_idx
  on public.tr_orders (fulfillment_status);

comment on column public.tr_orders.fulfillment_status is
  'Owner fulfillment pipeline: created → ready → shipped → delivered (or cancelled).';
