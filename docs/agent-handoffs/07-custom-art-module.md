# 07 — Custom-art module (print-on-demand)

**What this is:** the second product vertical — custom canvas-print items (minimora: "turn your child's drawing into a 3D figure"/canvas prints), and the **reference implementation** for the module-boundary pattern that the fashion module ([06-fashion-module.md](./06-fashion-module.md)) was extracted to match. If you're building a third vertical, copy this module's shape, not fashion's — it's smaller and cleaner precisely because it was designed as a module from the start, rather than extracted after the fact.

## The capability-flag pattern (read this first)

`src/lib/tr/catalogProfiles/` is the mechanism that lets fashion and custom_art share the same `TrProduct`/`tr_products` schema, checkout, and panel shell without `if (slug)` branching everywhere:

- `TrCatalogProfileId = "fashion" | "custom_art"` — one DB column (`tr_boutiques.catalog_profile`) picks the vertical.
- `TrCatalogProfileCapabilities` — a flags struct per profile: `showProductsNav`, `showStockNav`, `allowProductRoutes`, `pdpLayout`, `skipStockValidation`, `skipInventoryDecrement`, and a few more. `resolveCatalogProfile()` / `catalogProfileCapabilities()` / `isCustomArtCatalogProfile()` in `registry.ts` are the read API.
- Consumed consistently across ~29 files: checkout validation, PDP layout choice, owner panel nav (`panelNavForProfile()` in `panelNav.ts`), product-route gating (`TrOwnerProductRouteGate`).

This is a **capability-flags pattern, not a full plugin architecture** — one enum, one flags struct, no per-vertical handler classes. It's intentionally minimal; don't over-engineer a third vertical's onboarding beyond what this needs.

## What's genuinely custom_art-specific

- `src/lib/tr/customArt/pricing.ts` — per-canvas-size pricing.
- `src/lib/tr/customArt/referenceAssets.ts`, `uploadClient.ts`, `uploadRateLimit.ts` — the customer reference-image upload flow (a customer uploads their child's drawing/photo; stored under the `"customer-references"` asset kind). API: `POST /api/tr/customer/upload-reference`.
- `src/lib/tr/customArt/types.ts` — `TrCustomArtProductFeatures` (`sizePricesKurus`: per-size price in kuruş; `madeToOrder`: skips stock checks and inventory decrement — this is what `skipStockValidation`/`skipInventoryDecrement` capability flags actually gate).
- `src/components/tr/boutique/pdp/TrCustomArtProductPanel.tsx` — the custom_art PDP layout (upload widget instead of a size/color picker).
- No category concept at all — `custom_art` products aren't organized into a taxonomy the way fashion's are. If you add categories to this vertical, that's the trigger to finally build the generic category registry mentioned in doc 06.

## A known deviation worth knowing about

Despite the capability-flag pattern existing precisely to avoid slug checks, a few storefront components still branch on an explicit `isMinimoraBoutique()` check rather than the `catalog_profile` capability flags: `TrBoutiqueEditorialHome`, `TrBoutiqueEditorialShell`, `TrCustomArtProductPanel`, `TrBoutiqueEditorialHelpFab`. This works today because minimora is the only `custom_art` boutique, but it's the same anti-pattern the rest of this docs set warns against — if a second `custom_art` boutique is ever onboarded, these branch points need to move to capability flags instead of the boutique's specific slug.

## Code map

| Concern | Path |
|---|---|
| Capability registry | `src/lib/tr/catalogProfiles/{types,registry}.ts` |
| Pricing | `src/lib/tr/customArt/pricing.ts` |
| Reference upload | `src/lib/tr/customArt/{referenceAssets,uploadClient,uploadRateLimit}.ts`, `src/app/api/tr/customer/upload-reference/` |
| Feature types | `src/lib/tr/customArt/types.ts` |
| PDP | `src/components/tr/boutique/pdp/TrCustomArtProductPanel.tsx` |
| Minimora-specific components | `src/components/tr/boutique/minimora/` |
| Panel nav gating | `src/lib/tr/panelNav.ts` (`panelNavForProfile()`) |
| Route gating | `TrOwnerProductRouteGate` |
| Schema | `supabase/patch_tr_custom_art_vertical.sql` |
| Onboarding scripts (historical minimora setup) | `scripts/seed-minimora.mts`, `scripts/link-tr-boutique-owner.mts` |

## Related

- The module-boundary pattern this mirrors: [06-fashion-module.md](./06-fashion-module.md)
- Tenant model & `catalog_profile` column: [03-multi-tenant-boutiques.md](./03-multi-tenant-boutiques.md)
- Owner panel capability gating in context: [05-owner-panel-commerce.md](./05-owner-panel-commerce.md)
