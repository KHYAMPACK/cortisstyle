# 02 — Lookbook Studio (content ops)

**Role:** Internal Vite SPA for authoring look collages / garment cutouts. Enables Phase 1–3 content; not a customer-facing storefront.

## What we do today

- Separate app in `studio/` (Vite + React + Tailwind + fabric canvas)
- Built with `npm run build:studio`; Next `build` runs studio first
- Served at `/studio` via middleware rewrite to `/studio/index.html`
- Next APIs under `src/app/api/studio/*` (session, drafts, assets, imports, analyze-garment, remove-bg)
- Curator gate: env allowlist and/or `studio_curators` table
- Photoroom / vision keys for BG removal and garment analysis
- Shared cookie session with main site on `.cortisstyle.com` when configured

## What we will do / direction

- Produce look packages that feed international lookbook and TR `kombin` experiences
- Keep studio auth and CORS correct when changing domains
- Treat studio as **ops tooling** — don’t ship boutique-owner UX here unless explicitly asked

## Key paths

| Concern | Path |
|---------|------|
| SPA source | `studio/src/` |
| Vite config | `studio/vite.config.ts` |
| APIs | `src/app/api/studio/` |
| Lib | `src/lib/studio*.ts`, `studioCuratorAccess.ts`, Photoroom helpers |
| Schema | `supabase/patch_studio_drafts.sql`, `patch_studio_import_cache.sql`, `patch_studio_curators.sql` |
| Integration doc | `docs/lookbook-studio-integration.md` |

## Agent rules of thumb

- Studio is **excluded** from Next `tsconfig` — typecheck/run it as its own app.
- Use `NEXT_PUBLIC_STUDIO_URL` / CORS helpers; don’t hardcode studio origins.
- Draft persistence goes through studio APIs + Supabase, not ad-hoc files in `public/`.
