# Seed Pervin Soysal Butik (requires migration + dev server)

Requires:
1. Run in Supabase SQL Editor (order matters):
   - `supabase/patch_tr_boutique_brand.sql` (if not already)
   - `supabase/patch_tr_boutique_storefront.sql` (`home_layout`, `custom_domain`, `editorial_content`, `tr_customer_profiles`)
2. Dev server: `npm run dev`
3. Set `TR_ADMIN_SECRET` in `.env.local`
4. Optional: `TR_BOUTIQUE_DOMAINS={"pervinsoysal.com":"pervinsoysalbutik","www.pervinsoysal.com":"pervinsoysalbutik"}`

```powershell
$body = Get-Content -Raw "src/data/tr/pervinsoysalbutik-seed.json"
$secret = $env:TR_ADMIN_SECRET  # or paste from .env.local
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/tr/admin/seed" `
  -Headers @{ Authorization = "Bearer $secret" } `
  -ContentType "application/json" `
  -Body $body
```

If the boutique slug already exists, delete the row in Supabase before re-seeding (or PATCH brand fields via panel / SQL).

After seed, open `/tr/pervinsoysalbutik` for the editorial storefront.
