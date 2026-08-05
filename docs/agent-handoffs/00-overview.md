# 00 — Project overview (agent handoff)

## What Cortisstyle is

One product, three business phases on a shared stack:

1. **Boutique websites** — give Instagram boutiques a real storefront (white-label + custom domain + owner panel).
2. **Multi-tenant marketplace (Cadde / pazaryeri)** — outfit-first shopping across boutiques under `/tr`.
3. **Sell enablement** — tools and growth loops that actually create sales (catalog AI, campaigns, content, affiliate).

Same brand, same domain, geo-split experiences:

| Visitor | Experience | Monetization |
|---------|------------|--------------|
| International | Editorial lookbook + wardrobe | Affiliate links |
| Turkey (`/tr`) | Boutique storefronts + marketplace | On-site sales (iyzico; WhatsApp interim today) |

Future rebrand name in docs: **Lookbook**. Code and domain today: **cortisstyle**.

## Stack (do not invent a parallel one)

- **Next.js 16** App Router + React 19 + React Compiler + Tailwind 4
- **Supabase** (auth, Postgres, storage) — patches in `supabase/*.sql` (run manually in SQL editor)
- **Zustand** for TR carts/favorites
- **Vite SPA** in `studio/` (Lookbook Studio), built into `/studio` and served via middleware
- Alias `@/*` → `src/*`. Studio is outside Next `tsconfig`.

Read Next docs under `node_modules/next/dist/docs/` before assuming App Router APIs from older training data (`AGENTS.md`).

## Code map by product surface

```
International lookbook     → src/app/page.tsx, /wardrobe, src/lib/dynamicLooks/, affiliate
Lookbook Studio            → studio/, src/app/api/studio/, src/lib/studio*
Boutique SaaS (Phase 1)    → src/app/tr/[boutiqueSlug]/, /tr/panel, custom domains
TR Marketplace (Phase 2)   → src/app/tr/(marketplace)/, src/lib/tr/looks/, platform cart
Commerce rails             → checkout/orders APIs, WhatsApp, discounts, fulfillment patches
Sell enablement (Phase 3)  → FASHN packshot/try-on, aiModel, catalogBackgrounds, TikTok/affiliate, kampanyalar
```

**Tenant model:** one row in `tr_boutiques` (slug). Products/orders scoped by `boutique_id`. Custom host → slug via `src/lib/tr/customDomain.ts` + middleware.

## Hard product rules

- Differentiator is **curated outfits / looks**, not another Shopier clone.
- Boutiques need **vergi levhası** before real listing (ops rule; see roadmap docs).
- Sellers ship their own pieces; platform is aracı; payment processor is **iyzico** (not built yet — checkout often WhatsApp/sandbox).
- Prefer **registries + env + lib/** over hardcoding in components (`.cursor/rules/implementation-principles.mdc`).

## WIP vs live (mental model)

- International lookbook + studio + TR route shells + owner panel: **real code paths**.
- Empty live catalog → **demo catalog** (`src/lib/tr/looks/demoCatalog.ts`, `isTrDemoCatalogActive`).
- `TR_CHECKOUT_ENABLED=false` → WhatsApp / sandbox orders, not production card pay.
- Phase 3 is mostly **tooling + playbooks**, not a separate `/ads` product.

## Where to start for a task

1. Match the task to a handoff section in [README.md](./README.md).
2. TR URLs: `src/lib/tr/paths.ts`.
3. TR domain types: `src/types/tr-marketplace.ts`.
4. Edge behavior (geo, custom domain, studio SPA): `src/middleware.ts`.
5. Env template: `localdevseeds` (incomplete — also grep `process.env` in the area you touch).

## Related deep docs

- Vision: `docs/turkey-marketplace-concept.md`
- Ops roadmap: `docs/turkey-shop-roadmap.md`
- Studio: `docs/lookbook-studio-integration.md`
- Cleanup debt: `docs/codebase-cleanup-audit.md`
