# 09 — Cadde marketplace

**What this is:** "Cadde" is the cross-boutique marketplace surface — a shared browse/cart experience spanning multiple boutiques' products, distinct from any single boutique's own storefront (see [04-storefront-editorial-home.md](./04-storefront-editorial-home.md)). This is what a boutique with `home_layout: "default"` renders into; boutiques on `"editorial"` layout don't participate in it and use their own local cart instead.

Don't confuse this with the *international* lookbook product — that's a different, now-archived surface that ships from the sibling `cortisstyle-international` repo (see `01-international-lookbook.md`). Cadde is the TR-market, live-in-this-repo marketplace.

## Structure

Routes live under `src/app/tr/(marketplace)/`, wrapped by `TrMarketplaceChrome`. Content model is "looks" (curated outfit/product groupings) — `src/lib/tr/looks/`, with `demoCatalog.ts` holding any remaining demo/sample look data (trimmed of dead demo-boutique entries during the boutique purges).

Cart: `src/store/trCartStore.ts` is the **Cadde platform cart** — keep this separate from `trBoutiqueLocalCartStore.ts` (the per-boutique editorial-layout cart from doc 04). They are intentionally two different systems; never merge them.

`isTrDemoCatalogActive` (`src/lib/tr/platform.ts`) gates whether demo/sample catalog content shows at all.

## Visual pieces

The homepage/hero treatment has its own naming convention ("Cadde" prefix):

- `CaddeIntroStack` (`caddeIntro.ts`, `introLoader.ts`) — intro animation sequence.
- `CaddeSplitHero` (`caddeHero.ts`) — the split hero unit. Generated/prepared via `npm run tr:generate-cadde-hero` and `npm run tr:prepare-cadde-hero` (see `scripts/generate-cadde-hero-tryons.mts`, `scripts/prepare-cadde-hero-cutouts.mts`).
- `CaddePageTransition`, `caddeUi.ts` — shared transition/UI helpers.
- `CaddePlusReveal` — reveal animation component.
- Look display components: `TrLookMosaic`, `TrLookLookbook`, `TrLookSplit` (has `useCaddeLookRailAutoplay` for the auto-scrolling rail).

## Types

`src/types/tr-look.ts`, `src/types/tr-cart.ts` — the look and cart shapes specific to this surface (distinct from `TrProduct`/`TrProductFeatures` in `tr-marketplace.ts`, though they reference the same underlying products).

## Code map

| Concern | Path |
|---|---|
| Routes / chrome | `src/app/tr/(marketplace)/`, `TrMarketplaceChrome` |
| Looks content | `src/lib/tr/looks/` |
| Platform cart | `src/store/trCartStore.ts` |
| Hero/intro | `src/lib/tr/looks/caddeIntro.ts`, `caddeHero.ts`, `introLoader.ts` |
| Types | `src/types/tr-look.ts`, `src/types/tr-cart.ts` |

## Related

- Boutique storefront (the other, per-tenant surface): [04-storefront-editorial-home.md](./04-storefront-editorial-home.md)
- International lookbook (a different, archived, out-of-repo product — don't confuse with Cadde): `01-international-lookbook.md`
