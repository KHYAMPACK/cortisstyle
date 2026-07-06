# Seed Pervin Soysal Butik (requires migration + dev server)

Requires:
1. Run `supabase/patch_tr_boutique_brand.sql` in Supabase SQL Editor
2. Dev server: `npm run dev`
3. Set `TR_ADMIN_SECRET` in `.env.local`

```powershell
$body = Get-Content -Raw "src/data/tr/pervinsoysalbutik-seed.json"
$secret = $env:TR_ADMIN_SECRET  # or paste from .env.local
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/tr/admin/seed" `
  -Headers @{ Authorization = "Bearer $secret" } `
  -ContentType "application/json" `
  -Body $body
```

If the boutique slug already exists, delete the row in Supabase before re-seeding.
