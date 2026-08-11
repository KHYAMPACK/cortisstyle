# 00 — Project overview (agent handoff)

## What Cortisstyle is (live)

**Turkey-first** multi-tenant fashion commerce on one Next.js app:

1. **Boutique websites** — Instagram boutiques get a real storefront (white-label + custom domain + owner panel).
2. **Multi-tenant marketplace (Cadde / pazaryeri)** — outfit-first shopping across boutiques under `/tr`.
3. **Sell enablement** — catalog AI, campaigns, content, growth loops.

**Company vs product:** **Ekiz Yazılım** builds/operates the software; **Cortisstyle** is the product/platform name. Boutique footers show the Ekiz watermark via `TrPlatformCredit` (`src/lib/platform/platformCredit.ts`) — do not put Cortisstyle as the company credit on white-label boutiques.

Root `/` always redirects to `/tr`.

International lookbook + wardrobe + Lookbook Studio live in the sibling archive repo **`cortisstyle-international`** (not this deploy target). See [01](./01-international-lookbook.md) / [02](./02-lookbook-studio.md) (archived pointers) and [14-tr-codemap.md](./14-tr-codemap.md).

## Stack (do not invent a parallel one)

- **Next.js 16** App Router + React 19 + React Compiler + Tailwind 4
- **Supabase** (auth, Postgres, storage) — patches in `supabase/*.sql` (run manually in SQL editor)
- **Zustand** for TR carts/favorites
- Alias `@/*` → `src/*`

Read Next docs under `node_modules/next/dist/docs/` before assuming App Router APIs from older training data (`AGENTS.md`).

## Code map by product surface

```
Boutique SaaS (Phase 1)    → src/app/tr/[boutiqueSlug]/, /tr/panel, custom domains
TR Marketplace (Phase 2)   → src/app/tr/(marketplace)/, src/lib/tr/looks/, platform cart
Commerce rails             → checkout/orders APIs, WhatsApp, discounts, fulfillment patches
Sell enablement (Phase 3)  → FASHN packshot/try-on, aiModel, catalogBackgrounds, kampanyalar
PhotoRoom rmbg (panel)     → src/lib/tr/ai/photoroomRemoveBg.ts
Folder layout              → docs/agent-handoffs/14-tr-codemap.md
International (archived)   → cortisstyle-international
```

**Tenant model:** one row in `tr_boutiques` (slug). Products/orders scoped by `boutique_id`. Custom host → slug via `src/lib/tr/customDomain.ts` + middleware.

## Hard product rules

- Differentiator is **curated outfits / looks**, not another Shopier clone.
- Boutiques need **vergi levhası** before real listing (ops rule; see roadmap docs).
- Sellers ship their own pieces; platform is aracı; payment processor is **iyzico** (checkout often WhatsApp/sandbox today).
- Prefer **registries + env + lib/** over hardcoding in components (`.cursor/rules/implementation-principles.mdc`).

## WIP vs live (mental model)

- TR route shells + owner panel + boutique storefronts: **live code paths**.
- Empty live catalog → **demo catalog** (`src/lib/tr/looks/demoCatalog.ts`, `isTrDemoCatalogActive`).
- `TR_CHECKOUT_ENABLED=false` → WhatsApp / sandbox orders, not production card pay.

## Where to start for a task

1. Match the task to a handoff section in [README.md](./README.md).
2. **Codemap:** [14-tr-codemap.md](./14-tr-codemap.md).
3. TR URLs: `src/lib/tr/paths.ts`.
4. TR domain types: `src/types/tr-marketplace.ts`.
5. Edge behavior (custom domain, `/` → `/tr`): `src/middleware.ts`.
6. Env template: `localdevseeds` (incomplete — also grep `process.env` in the area you touch).
7. Boutique health / next-tenant clone: [08](./08-boutique-audit-pervin.md), [09](./09-boutique-clone-playbook.md), [13](./13-boutique-wire-in-and-go-live.md).

## Related deep docs

- Vision: `docs/turkey-marketplace-concept.md`
- Ops roadmap: `docs/turkey-shop-roadmap.md`
- Boutique themes: `docs/lila-butik-e-ticaret-setup.md`
- Cleanup debt: `docs/codebase-cleanup-audit.md`
