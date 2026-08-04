-- Compare-at (list) price for sale display on storefront + panel campaigns.
alter table public.tr_products
  add column if not exists compare_at_price_kurus integer
  check (
    compare_at_price_kurus is null
    or compare_at_price_kurus > 0
  );

comment on column public.tr_products.compare_at_price_kurus is
  'Original price before discount (kuruş). When set and greater than price_kurus, product is on sale.';
