# 06 — Fashion module

**What this is:** the garment/apparel vertical — everything specific to selling clothes (Turkish category taxonomy, size charts, construction chips; the AI try-on/packshot pipeline is parked, see `docs/ai-pipeline-v1.md`) lives here, separated from the generic e-commerce core so that a fashion-specific bug or change can't break checkout, payments, or a future non-fashion boutique.

## Why this split exists

Cortisstyle started as a single-vertical (fashion) marketplace, so garment logic got baked into code that *sounds* generic (`catalog/`, `products.ts`) without actually being generic. The platform is meant to be a generic store-builder foundation that can support any product type, with vertical-specific behavior isolated behind a clean module boundary — `custom_art` (print-on-demand, see [07-custom-art-module.md](./07-custom-art-module.md)) is the second, smaller module proving the same pattern works.

**Standing rule:** if a piece of code is genuinely garment-specific, it belongs in `src/lib/tr/fashion/` or `src/components/tr/fashion/`, not in a generically-named core folder. If you're adding new garment logic, add it here from the start rather than letting it leak into `catalog/`, `aiCatalog/`, or a shared panel component.

## What lives here

- `src/lib/tr/fashion/categories.ts` — the Turkish garment category taxonomy (elbise, üst-giyim, bluz, pantolon, takım, …). This is fashion's registered default tree, not a generic "category system" — see the caveat below.
- `src/lib/tr/fashion/types.ts` — `TrFashionProductFeatures`, `TrTakimSetItem` (garment-specific fields of the `TrProductFeatures` union — see "Product features" below).
- `src/lib/tr/fashion/{garmentUploadTypes,sizeCharts,modelMeasurements,dressFeatures,takimUpload,careInstructions}.ts` — garment upload taxonomy, cm size charts, house-model body measurements (the PDP line for AI-made products), dress construction-chip vocabulary, takım product helpers, wash-care copy.
- `src/components/tr/fashion/panel/` — garment owner-panel components (the fashion editor, the create chooser).
- `src/components/tr/fashion/panel/TrFashionProductEditor.tsx` + `src/lib/tr/fashion/productForm.ts` — the garment product editor (manual save), built on the shared product fields.
- `src/components/tr/fashion/pdp/` — garment-specific PDP pieces (size chart modal, model measurements).

## Product features

`TrProductFeatures` (`src/types/tr-marketplace.ts`) is composed as `TrFashionProductFeatures & TrCustomArtProductFeatures` via `import type` from each module's own `types.ts`. This is the one place core imports from both vertical modules by design — it's a type-only composition boundary with zero runtime cost, the same pattern used by `src/lib/tr/catalog/productFeatures.ts`'s `sanitizeProductFeatures()` (a genuinely cross-vertical sanitizer, kept in `catalog/` rather than moved into either module).

## Enforcement: the ESLint boundary rule

`eslint.config.mjs` has an `import/no-restricted-paths` zone banning imports of `fashion/**` from a defined `FASHION_FREE_CORE_TARGETS` list — payments, shipping, catalogProfiles, customArt, the storefront rendering shell, auth, checkout/orders/boutiques API routes, and a handful of genuinely generic catalog files. **This list is deliberately not the whole `src/` tree** — the owner panel and the category-browsing storefront shell still import fashion internals for real, disclosed reasons (see "Known debt" below), and banning it there today would mean a long exceptions list instead of a real boundary.

If you clean up one of the areas listed under "known debt," add its directory to `FASHION_FREE_CORE_TARGETS` once it's actually clean — that's how this list is meant to grow over time. Don't add a directory to the target list that still has real fashion imports; the rule will just fail CI without fixing anything.

## Known debt (disclosed, not blocking)

- **~20 owner-panel components** (`TrProductCreateWizard`, `TrOwnerBatchCreatePage` + its steps, `TrOwnerTakimCreatePage`, `TrOwnerProductListPage`, `TrOwnerStockPage`, `TrOwnerSizeChartStock`, `TrOwnerProductFeaturesFields`, `TrOwnerCategoryPicker`, `TrBoutiquePdpInfoSections`) interleave generic and garment-specific UI in the same file. Splitting them is a bigger, riskier job than a file move — deferred on purpose.
- **Categories: the storefront no longer imports `fashion/categories.ts` directly** It goes through `TrStorefrontTaxonomy`; `fashion/legacyTaxonomy.ts` wraps this file's functions as the built-in tree, and `fashion/categoryTemplate.ts` + `fashion/garmentCategory.ts` let a boutique import the tree into its own `tr_categories` (with `system_key` = the built-in id) and map its categories back to garment ids for fashion logic. Panel pages still import `fashion/categories.ts` for labels and the legacy picker.

## Related

- Custom-art vertical (the sibling module, same pattern): [07-custom-art-module.md](./07-custom-art-module.md)
- The parked AI catalog pipeline: [08-ai-catalog-pipeline.md](./08-ai-catalog-pipeline.md)
- Owner panel (where most of the "known debt" mixed components live): [05-owner-panel-commerce.md](./05-owner-panel-commerce.md)
- Storefront category browsing (the other consumer of `fashion/categories.ts`): [04-storefront-editorial-home.md](./04-storefront-editorial-home.md)
