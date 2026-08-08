# Seed Lila Butik (tenant data only)

UI skin is **`atelier`** (Cecilie-structure editorial skin) — this seed only creates/updates DB row + products.

Requires the same Supabase patches as Pervin (`scripts/seed-pervinsoysalbutik.md`). Set `TR_ADMIN_SECRET` and run the dev server.

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

Then: `/tr/lilabutik` · domain `lilaboutiquedenizli.com` (optional) · link owner via `scripts/link-tr-boutique-owner.md`.

See `docs/lila-butik-e-ticaret-setup.md`.
