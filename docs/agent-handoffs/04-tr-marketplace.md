# 04 — TR marketplace / Cadde (Phase 2)

**Business job:** Multi-tenant pazaryeri where customers discover **looks** and pieces across boutiques, not only visit one store.

## What we do today

- Route group `src/app/tr/(marketplace)/` with marketplace chrome (`TrMarketplaceChrome`)
- Surfaces: home `/tr`, products, search, favorites, boutiques directory, look PDP `/tr/kombin/[slug]`, piece routes, cart/checkout aliases
- Cross-boutique **looks** composed from pieces (`src/lib/tr/looks/`)
- Platform cart store (`src/store/trCartStore.ts`) distinct from boutique-local cart
- Public catalog reads via `src/lib/tr/publicData.ts` / mappers
- Demo catalog fallback when live inventory is empty (`isTrDemoCatalogActive` in `platform.ts`)
- Geo entry from main site into `/tr`
- Cadde home `/tr` has a photo-stack intro (`CaddeIntroStack` via `IntroLoader`). Boutique custom-domain intro stays the logo mask. Do **not** run the Cadde stack on `/tr/[slug]`, `/tr/panel`, or white-label hosts.

## What we will do / direction

- Outfit-first discovery as the wedge vs Shopier/Trendyol grids
- Real multi-seller checkout split + boutique notifications (see commerce handoff)
- Featured / paid look placement later (Phase 3 revenue)
- Replace demo catalog with live boutique inventory as onboarding succeeds

## Key paths

| Concern | Path |
|---------|------|
| Routes | `src/app/tr/(marketplace)/` |
| Layout/chrome | `TrMarketplaceChrome`, `TrMarketplaceShell` |
| Looks | `src/lib/tr/looks/`, `/tr/kombin/[slug]` |
| Catalog | `src/lib/tr/products.ts`, `boutiques.ts`, `mappers.ts` |
| Platform flags | `src/lib/tr/platform.ts` |
| Types | `src/types/tr-marketplace.ts`, `tr-look.ts`, `tr-cart.ts` |
| Concept | `docs/turkey-marketplace-concept.md` |
| Cadde intro | `CaddeIntroStack`, `lib/platform/caddeIntro.ts`, gated in `lib/platform/introLoader.ts` |

## Agent rules of thumb

- Marketplace UX and boutique storefront UX share data but **different shells and carts**.
- PDP links from Cadde should preserve `from=cadde` where helpers support it (`TR_PDP_FROM_CADDE` in `paths.ts`).
- Do not hardcode boutique demos into marketplace home forever — registry/demo flags only.
- Money fields are integer **kuruş** in DB/types.
