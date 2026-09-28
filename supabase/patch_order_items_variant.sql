-- Order items remember which variant of a Gelişmiş product was bought (product upload
-- foundation, milestone M7c-1). See docs/product-upload-foundation-plan.md, section 8.
--
--   variant_id     the tr_product_variants row that was sold. Set to null if the owner
--                  later removes that combination; the order keeps its label.
--   variant_label  "Kırmızı / S" as it read at purchase — the snapshot every order
--                  screen shows, so it survives renames and deleted variants.
--
-- Orders for products without variants leave both null and behave exactly as before.
--
-- Apply patch_product_variants.sql first (this references tr_product_variants).
-- Safe to apply before or after the app version that uses it: the app only writes
-- these columns for a line that has a variant. Idempotent.
--
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

alter table public.tr_order_items
  add column if not exists variant_id uuid
    references public.tr_product_variants (id) on delete set null,
  add column if not exists variant_label text
    check (variant_label is null or char_length(variant_label) <= 200);

comment on column public.tr_order_items.variant_id is
  'The variant sold; null for products without variants or once the variant was removed.';
comment on column public.tr_order_items.variant_label is
  'The variant''s label at purchase (e.g. Kırmızı / S).';

commit;
