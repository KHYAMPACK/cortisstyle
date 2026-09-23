# Link a boutique owner (after migration + user signup)

Run in Supabase SQL Editor:

1. `supabase/patch_tr_boutique_owner.sql` (adds `owner_user_id` + `tr-assets` bucket)
2. Also ensure these have been applied:
   - `supabase/patch_tr_product_options.sql` (sizes/colors on products)
   - `supabase/patch_tr_product_stock.sql` (`stock` column, default 1)
   - `supabase/patch_tr_product_compare_at.sql` (sale / liste fiyatı)
   - `supabase/patch_tr_order_fulfillment.sql` (sipariş durumları)
   - `supabase/patch_tr_discount_codes.sql` (kuponlar)
   - `supabase/patch_tr_boutique_option_presets.sql` (butik beden/renk listesi)

## Link owner by email

After the owner signs up on cortisstyle.com (or the boutique login page):

```bash
npx tsx scripts/link-tr-boutique-owner.mts --email owner@example.com --domain example.com
# or by slug:
npx tsx scripts/link-tr-boutique-owner.mts --email owner@example.com --slug lilabutik
```

List boutiques: `npx tsx scripts/link-tr-boutique-owner.mts --list`

Or in Supabase SQL Editor:

```sql
-- Find auth user id
select id, email from auth.users where email = 'owner@example.com';

-- Link to Pervin boutique
update public.tr_boutiques
set owner_user_id = '<auth-user-uuid>'
where slug = 'pervinsoysalbutik';
```

Or via admin API (Bearer `TR_ADMIN_SECRET`):

```http
PATCH /api/tr/admin/boutiques/<boutique-uuid>/owner
Content-Type: application/json
Authorization: Bearer <TR_ADMIN_SECRET>

{ "ownerUserId": "<auth-user-uuid>" }
```

## Smoke test

1. Open `/tr/panel` and sign in as the owner (Ana Sayfa + KPI özeti)
2. **Ürünler** → create/edit products (photos, sizes, colors, eski fiyat, stok)
3. **Stok** → adjust quantities inline
4. **Siparişler** → open a seeded order → change fulfillment status
5. **Müşteriler** / **Kampanyalar** / **Raporlar** → confirm data
6. Confirm products appear on `/tr/pervinsoysalbutik`
7. **Ayarlar** → save WhatsApp / kargo notu → confirm storefront reflects
8. Edit → mark **Gizli** → confirm it leaves public available listings
6. Mark **Satıldı** → sold badge on storefront
7. Stub nav (Siparişler / Müşteriler / …) shows Yakında, not a dead end
