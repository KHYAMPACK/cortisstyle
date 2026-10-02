# 06 — Fashion module

**What this is:** the garment/apparel vertical — everything specific to selling clothes (Turkish category taxonomy, size charts, construction chips; the AI try-on/packshot pipeline is parked, see `docs/ai-pipeline-v1.md`) lives here, separated from the generic e-commerce core so that a fashion-specific bug or change can't break checkout, payments, or a future non-fashion boutique.

## Why this split exists

Cortisstyle started as a single-vertical (fashion) marketplace, so garment logic got baked into code that *sounds* generic (`catalog/`, `products.ts`) without actually being generic. The platform is meant to be a generic store-builder foundation that can support any product type, with vertical-specific behavior isolated behind a clean module boundary — `custom_art` (print-on-demand, see [07-custom-art-module.md](./07-custom-art-module.md)) is the second, smaller module proving the same pattern works.

**Standing rule:** if a piece of code is genuinely garment-specific, it belongs in `src/lib/tr/fashion/` or `src/components/tr/fashion/`, not in a generically-named core folder. If you're adding new garment logic, add it here from the start rather than letting it leak into `catalog/`, `aiCatalog/`, or a shared panel component.

## What lives here

- `src/lib/tr/fashion/categories.ts` — the Turkish garment category taxonomy (elbise, üst-giyim, bluz, pantolon, takım, …). This is fashion's registered default tree, not a generic "category system" — see the caveat below.
- `src/lib/tr/fashion/types.ts` — `TrFashionProductFeatures`, `TrTakimSetItem` (garment-specific fields of the `TrProductFeatures` union — see "Product features" below).
- `src/lib/tr/fashion/{modelMeasurements,dressFeatures,takimUpload,careInstructions}.ts` — house-model body measurements (the PDP line for AI-made products), dress construction-chip vocabulary, takım product helpers, wash-care copy.
- The fashion product editor and create flows were removed in F3 (2026-10-02): fashion products open in the shared `TrProductEditor`, their fields come from the store's product kinds (`fashion/kindTemplate.ts` is the starter set).
- `src/components/tr/fashion/pdp/` — garment-specific PDP pieces (model measurements). The cm size charts and the PDP "Beden tablosu" modal were removed on 2026-10-02 (Mert: to be re-added cleanly as data later, see F4 in `docs/foundation-no-hardcode-plan.md`).

## Product features

`TrProductFeatures` (`src/types/tr-marketplace.ts`) is composed as `TrFashionProductFeatures & TrCustomArtProductFeatures` via `import type` from each module's own `types.ts`. This is the one place core imports from both vertical modules by design — it's a type-only composition boundary with zero runtime cost, the same pattern used by `src/lib/tr/catalog/productFeatures.ts`'s `sanitizeProductFeatures()` (a genuinely cross-vertical sanitizer, kept in `catalog/` rather than moved into either module).

## Enforcement: the ESLint boundary rule

`eslint.config.mjs` has an `import/no-restricted-paths` zone banning imports of `fashion/**` from a defined `FASHION_FREE_CORE_TARGETS` list — payments, shipping, catalogProfiles, customArt, the storefront rendering shell, auth, checkout/orders/boutiques API routes, and a handful of genuinely generic catalog files. **This list is deliberately not the whole `src/` tree** — the owner panel and the category-browsing storefront shell still import fashion internals for real, disclosed reasons (see "Known debt" below), and banning it there today would mean a long exceptions list instead of a real boundary.

If you clean up one of the areas listed under "known debt," add its directory to `FASHION_FREE_CORE_TARGETS` once it's actually clean — that's how this list is meant to grow over time. Don't add a directory to the target list that still has real fashion imports; the rule will just fail CI without fixing anything.

## Known debt (disclosed, not blocking)

- **Some owner-panel components** (`TrOwnerProductListPage`, `TrOwnerStockPage`, `TrOwnerSizeChartStock`, `TrBoutiquePdpInfoSections`) interleave generic and garment-specific UI in the same file. Splitting them is a bigger, riskier job than a file move — deferred on purpose.
- **Categories: the storefront no longer imports `fashion/categories.ts` directly** It goes through `TrStorefrontTaxonomy`; `fashion/categoryTemplate.ts` is the starter tree a boutique imports into its own `tr_categories` (with `system_key` = the built-in id; `fashion/seedCategories.ts`, run at store creation and by "Hazır kategorileri içe aktar"), and `fashion/kindTemplate.ts` maps its categories back to garment ids (`garmentCategoryFor`) when kinds are imported. Since F1 (2026-10-02) nothing renders the built-in tree as a store's categories; `fashion/categories.ts` remains only for the templates and that mapping. `fashion/kindTemplate.ts` (F2) is the starter set of product kinds and fields, built from `dressFeatures.ts` (a test keeps them equal to what the editor shows), plus the garment → kind mapping used when importing it (`fashion/seedKinds.ts`).

## Related

- Custom-art vertical (the sibling module, same pattern): [07-custom-art-module.md](./07-custom-art-module.md)
- The parked AI catalog pipeline: [08-ai-catalog-pipeline.md](./08-ai-catalog-pipeline.md)
- Owner panel (where most of the "known debt" mixed components live): [05-owner-panel-commerce.md](./05-owner-panel-commerce.md)
- Storefront category browsing (the other consumer of `fashion/categories.ts`): [04-storefront-editorial-home.md](./04-storefront-editorial-home.md)
