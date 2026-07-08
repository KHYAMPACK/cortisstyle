# Link a boutique owner (after migration + user signup)

Run in Supabase SQL Editor:

1. `supabase/patch_tr_boutique_owner.sql` (adds `owner_user_id` + `tr-assets` bucket)
2. Also ensure `supabase/patch_tr_product_options.sql` has been applied (sizes/colors)

## Link owner by email

After the owner signs up on cortisstyle.com:

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
2. **Ürünler** → create a product with photos, sizes, colors
3. Confirm it appears on `/tr/pervinsoysalbutik`
4. **Ayarlar** → save WhatsApp / kargo notu → confirm storefront reflects
5. Edit → mark **Gizli** → confirm it leaves public available listings
6. Mark **Satıldı** → sold badge on storefront
7. Stub nav (Siparişler / Müşteriler / …) shows Yakında, not a dead end
