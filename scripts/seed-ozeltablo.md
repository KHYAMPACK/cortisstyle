# Seed `ozeltablo` (custom art tenant)

1. Apply SQL (once per env):
   - `supabase/patch_tr_boutiques_catalog_profile.sql`
   - `supabase/patch_tr_order_items_customization.sql`
   - Re-run `supabase/patch_tr_boutiques_public_view.sql`

2. Add assets under `public/tr/boutiques/ozeltablo/`:
   - `logo.png`, `favicon.png`
   - `examples/sample-1.jpg`, `sample-2.jpg` (PDP gallery)

3. Seed:

```bash
curl -X POST "http://localhost:3000/api/tr/admin/seed" \
  -H "Authorization: Bearer $TR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  --data-binary "@src/data/tr/ozeltablo-seed.json"
```

4. Link owner: `scripts/link-tr-boutique-owner.md`

5. Smoke:
   - `/tr/ozeltablo` → hero → product PLP/PDP
   - Upload photo + size + checkout
   - Panel: no Ürünler/Stok; order shows reference photo
