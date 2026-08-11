# Seed Lila Butik (tenant data only)

UI skin is **`atelier`** (Cecilie-structure editorial skin) — this seed only creates/updates DB row + products.

Requires the same Supabase patches as Pervin (`scripts/seed-pervinsoysalbutik.md`), especially:

- `supabase/patch_tr_boutiques_public_view.sql` — public reads use `tr_boutiques_public` (`status = 'verified'` only)

Set `TR_ADMIN_SECRET` and run against the **same Supabase project as the target deploy** (local `.env.local` ≠ Vercel until secrets match).

```powershell
$path = Resolve-Path "src/data/tr/lilabutik-seed.json"
$body = Get-Content -Raw $path
$secret = $env:TR_ADMIN_SECRET  # or paste from .env.local
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/tr/admin/seed" `
  -Headers @{ Authorization = "Bearer $secret" } `
  -ContentType "application/json; charset=utf-8" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```

Seed sets/keeps `status: verified`. Re-seed on an existing draft/pending row now also flips status to verified.

## If storefront 404s (“Butik bulunamadı”)

1. SQL diagnose/fix: `supabase/fix_tr_boutiques_public_visibility.sql`
2. After deploy: `GET /api/tr/admin/boutique-health` with `Authorization: Bearer {TR_ADMIN_SECRET}`
3. Confirm Vercel `NEXT_PUBLIC_SUPABASE_URL` + anon key match the project you seeded; rotate `SUPABASE_SERVICE_ROLE_KEY` if the health `service` probe fails
4. Purge Vercel cache / redeploy — boutique layout is `force-dynamic` so empty lookups are not sticky

Then: `/tr/lilabutik` · domain `lilaboutiquedenizli.com` · link owner via `scripts/link-tr-boutique-owner.md`.

See `docs/lila-butik-e-ticaret-setup.md`.
