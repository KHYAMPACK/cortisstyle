-- Product details: Ürün detayı, Envanter, Stok and Birim fiyat fields
-- (product upload foundation, milestone M4). See docs/product-upload-foundation-plan.md.
--
-- tr_products (public-safe, readable by the storefront like every other column):
--   description_html                       sanitized rich-text description; `description`
--                                          keeps its plain-text form
--   brand, tags, google_category           Marka, Etiket, Google ürün kategorisi (free text)
--   sku, barcode, desi                     Envanter; desi = shipping volume weight
--   continue_selling_when_out_of_stock     "Stoğu tükenince satmaya devam et" (stored; the
--                                          storefront does not act on it yet)
--   unit_price_enabled, unit_amount,
--   unit_type                              Birim fiyat (price per kg / l / m …)
--
-- tr_product_private (owner-only, service role — tr_products is publicly readable):
--   supplier, hs_code                      Tedarikçi and HS kodu (stored only)
--
-- Apply patch_product_types.sql first (it creates tr_product_private).
--
-- Safe to apply before or after the app version that uses it: saving a Basit ürün
-- without any of these values works either way; saving values into columns that do not
-- exist yet fails with a message that names this file (nothing is lost silently).
-- Idempotent: re-running does not touch existing values.
--
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

alter table public.tr_products
  add column if not exists description_html text,
  add column if not exists brand text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists google_category text,
  add column if not exists sku text,
  add column if not exists barcode text,
  add column if not exists desi numeric(6, 2),
  add column if not exists continue_selling_when_out_of_stock boolean not null default false,
  add column if not exists unit_price_enabled boolean not null default false,
  add column if not exists unit_amount numeric(12, 3),
  add column if not exists unit_type text;

-- Limits mirror src/lib/tr/productDetails.ts; the API enforces them first.
alter table public.tr_products drop constraint if exists tr_products_details_check;
alter table public.tr_products
  add constraint tr_products_details_check check (
    (brand is null or char_length(brand) <= 120)
    and (google_category is null or char_length(google_category) <= 250)
    and (sku is null or char_length(sku) <= 64)
    and (barcode is null or char_length(barcode) <= 64)
    and (description_html is null or char_length(description_html) <= 60000)
    and cardinality(tags) <= 20
    and (desi is null or desi > 0)
    and (unit_amount is null or unit_amount > 0)
    and (unit_type is null or unit_type in ('g', 'kg', 'ml', 'l', 'cm', 'm', 'm2', 'adet'))
    and (not unit_price_enabled or (unit_amount is not null and unit_type is not null))
  );

alter table public.tr_product_private
  add column if not exists supplier text,
  add column if not exists hs_code text;

alter table public.tr_product_private
  drop constraint if exists tr_product_private_details_check;
alter table public.tr_product_private
  add constraint tr_product_private_details_check check (
    (supplier is null or char_length(supplier) <= 120)
    and (hs_code is null or char_length(hs_code) <= 16)
  );

comment on column public.tr_products.description_html is
  'Sanitized rich-text description (see src/lib/tr/richTextSanitize.ts). description holds the plain-text form.';
comment on column public.tr_products.continue_selling_when_out_of_stock is
  'Stored only for now: the storefront and inventory do not act on it yet.';
comment on column public.tr_product_private.supplier is 'Owner-only, stored only.';
comment on column public.tr_product_private.hs_code is 'Owner-only GTİP code, stored only.';

commit;
