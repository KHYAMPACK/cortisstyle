# Seed Pervin Soysal Butik (requires migration + dev server)

Requires:
1. Run in Supabase SQL Editor (order matters) — missing product columns cause storefront 404:
   - `supabase/patch_tr_boutique_brand.sql` (if not already)
   - `supabase/patch_tr_boutique_storefront.sql` (`home_layout`, `custom_domain`, `editorial_content`, `tr_customer_profiles`)
   - `supabase/patch_tr_product_options.sql` (`sizes`, `colors`)
   - `supabase/patch_tr_product_marketplace_images.sql`
   - `supabase/patch_tr_product_stock.sql`
   - `supabase/patch_tr_product_compare_at.sql` (**required** — without it public product select fails)
   - `supabase/patch_tr_product_catalog_background.sql` (catalog backdrop id per product)
   - `supabase/patch_tr_order_fulfillment.sql` (**required** for checkout — adds `fulfillment_status`)
   - `supabase/patch_tr_discount_codes.sql`
2. Set `TR_ADMIN_SECRET` in `.env.local`
3. Dev server: `npm run dev` (restart after changing `TR_CHECKOUT_ENABLED`)
4. For live cart + sandbox orders: `TR_CHECKOUT_ENABLED=true`
5. Optional: `TR_BOUTIQUE_DOMAINS={"pervinsoysal.com":"pervinsoysalbutik","www.pervinsoysal.com":"pervinsoysalbutik"}`

```powershell
$body = Get-Content -Raw "src/data/tr/pervinsoysalbutik-seed.json"
$secret = $env:TR_ADMIN_SECRET  # or paste from .env.local
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/tr/admin/seed" `
  -Headers @{ Authorization = "Bearer $secret" } `
  -ContentType "application/json" `
  -Body $body
```

Seed creates: boutique + ~10 demo products + sample sandbox orders + coupon codes.

If the boutique slug already exists, delete related `tr_order_items` / `tr_orders` / `tr_products` / boutique row in Supabase before re-seeding (or start fresh).

Then link owner (`scripts/link-tr-boutique-owner.md`) and open `/tr/panel`.

Storefront: `/tr/pervinsoysalbutik`
