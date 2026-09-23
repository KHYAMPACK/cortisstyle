# 07 — Custom-art module (print-on-demand)

**What this is:** the second product vertical — custom canvas-print items (upload a photo/drawing, get it printed). As of 2026-09 there is **no live `custom_art` boutique** — the one that existed (`minimora`) was deleted (see the deviation note below) — but the module stays as the **reference implementation** for the module-boundary pattern that the fashion module ([06-fashion-module.md](./06-fashion-module.md)) was extracted to match. If you're building a third vertical, copy this module's shape, not fashion's — it's smaller and cleaner precisely because it was designed as a module from the start, rather than extracted after the fact.

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

## What happened to minimora

`minimora` was the one `custom_art` boutique. Beyond the genuine vertical differences (upload flow, no sizes/categories), it also had a fully bespoke visual identity baked into component code: its own home page, header, footer, fonts, and brand color hardcoded behind an `isMinimoraBoutique()` slug check in four storefront components — the same "hardcoded per-slug branch" anti-pattern this docs set warns about elsewhere, just for visuals instead of tenant config.

When minimora's home page needed to render through the generic editorial shell instead (to avoid maintaining a second bespoke shell for one boutique), the generic home defaults turned out to be fashion-flavored — garment category tiles make no sense on a canvas-print shop with one product. Rather than build a `custom_art`-aware generic home variant for a boutique with zero orders, it was deleted outright: the `tr_boutiques` row, its product, the entire bespoke component tree, and every leftover per-slug entry in `boutiqueBrand.ts`/`authMail/templates.ts`.

**The lesson for whoever onboards the next `custom_art` boutique:** don't give it a bespoke header/footer/home-page component tree gated by a slug check. If it needs to look meaningfully different from a fashion boutique's home page, that's a sign the generic editorial home builder needs a `catalog_profile`-aware variant (skip category tiles, etc.) — a real capability, not a one-off component swap.

## Code map

| Concern | Path |
|---|---|
| Capability registry | `src/lib/tr/catalogProfiles/{types,registry}.ts` |
| Pricing | `src/lib/tr/customArt/pricing.ts` |
| Reference upload | `src/lib/tr/customArt/{referenceAssets,uploadClient,uploadRateLimit}.ts`, `src/app/api/tr/customer/upload-reference/` |
| Feature types | `src/lib/tr/customArt/types.ts` |
| PDP | `src/components/tr/boutique/pdp/TrCustomArtProductPanel.tsx` |
| Panel nav gating | `src/lib/tr/panelNav.ts` (`panelNavForProfile()`) |
| Route gating | `TrOwnerProductRouteGate` |
| Schema | `supabase/patch_tr_custom_art_vertical.sql` |
| Onboarding script | `scripts/link-tr-boutique-owner.mts` |

## Related

- The module-boundary pattern this mirrors: [06-fashion-module.md](./06-fashion-module.md)
- Tenant model & `catalog_profile` column: [03-multi-tenant-boutiques.md](./03-multi-tenant-boutiques.md)
- Owner panel capability gating in context: [05-owner-panel-commerce.md](./05-owner-panel-commerce.md)
