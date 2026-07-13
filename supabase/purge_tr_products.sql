-- Purge all TR clothing inventory (Phase 1 cloth reset).
-- Run in Supabase SQL Editor. Keeps boutique storefront shells.
--
-- Does NOT touch:
--   public.tr_boutiques
--   Storage bucket objects (orphans under tr-assets may be cleaned later)
--   International lookbook files outside Supabase

-- Order of delete respects FKs (tr_order_items.product_id → tr_products)
delete from public.tr_order_items;
delete from public.tr_orders;
delete from public.tr_products;
