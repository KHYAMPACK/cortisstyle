# 03 — Boutique storefronts (Phase 1)

**Business job:** Get boutiques off WhatsApp/Shopier-only selling onto a branded site we host — first step into ecommerce.

## What we do today

- Per-tenant storefront at `/tr/[boutiqueSlug]` (home, PLP, PDP, local cart, checkout, legal, login)
- **Custom domains** rewrite into boutique paths (`src/lib/tr/customDomain.ts` + middleware; e.g. pervinsoysal)
- **Editorial** home/PDP templates via registries (`src/lib/tr/boutiqueHome/`, `boutiquePdp/`)
- **Owner panel** at `/tr/panel` — Ikas-like modules (products, stock, orders, customers, campaigns, content packs, reports, settings)
- Owner APIs: `src/app/api/tr/owner/*` authenticated via boutique `owner_user_id`
- Onboarding seeds: `scripts/seed-pervinsoysalbutik.*`, `src/data/tr/pervinsoysalbutik-seed.json`
- Brand fields: WhatsApp/IG, theme, commission, option presets, stock, compare-at pricing

## What we will do / direction

- Onboard more boutiques with vergi levhası + signed contract (ops; see roadmap)
- Strengthen editorial templates without turning into generic card grids
- Keep boutique-local cart separate from marketplace platform cart
- Grow owner panel into real day-to-day ops (fulfillment, discounts, catalog quality)

## Key paths

| Concern | Path |
|---------|------|
| Routes | `src/app/tr/[boutiqueSlug]/`, `src/app/tr/panel/` |
| UI | `src/components/tr/boutique/`, `src/components/tr/panel/` |
| Data | `src/lib/tr/boutiques.ts`, `products.ts`, `storefront.ts`, `publicData.ts` |
| Auth | `src/lib/tr/ownerAuth.ts`, `ownerClient.ts` |
| URLs | `src/lib/tr/paths.ts` (`trBoutiquePath`, product paths) |
| Domain | `src/lib/tr/customDomain.ts` |
| Types | `src/types/tr-marketplace.ts` |
| Schema | `supabase/patch_tr_marketplace.sql` + `patch_tr_boutique_*`, `patch_tr_product_*` |

## Agent rules of thumb

- Tenant boundary is `boutique_id` / slug — never leak another boutique’s products in owner APIs.
- Prefer extending **boutiqueHome / boutiquePdp registries** over forking a new layout per client.
- Boutique cart: `src/store/trBoutiqueLocalCartStore.ts` (not the Cadde platform cart).
- Demo/editorial content (`demo-maya`, `editorialDemo*`) is placeholder — don’t treat as production inventory.
