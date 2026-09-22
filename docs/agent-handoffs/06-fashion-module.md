# 06 — Fashion module

**What this is:** the garment/apparel vertical — everything specific to selling clothes (Turkish category taxonomy, size charts, construction chips, AI try-on/packshot pipeline) lives here, separated from the generic e-commerce core so that a fashion-specific bug or change can't break checkout, payments, or a future non-fashion boutique.

## Why this split exists

Cortisstyle started as a single-vertical (fashion) marketplace, so garment logic got baked into code that *sounds* generic (`catalog/`, `products.ts`) without actually being generic. The platform is meant to be a generic store-builder foundation that can support any product type, with vertical-specific behavior isolated behind a clean module boundary — `custom_art` (print-on-demand, see [07-custom-art-module.md](./07-custom-art-module.md)) is the second, smaller module proving the same pattern works.

**Standing rule:** if a piece of code is genuinely garment-specific, it belongs in `src/lib/tr/fashion/` or `src/components/tr/fashion/`, not in a generically-named core folder. If you're adding new garment logic, add it here from the start rather than letting it leak into `catalog/`, `aiCatalog/`, or a shared panel component.

## What lives here

- `src/lib/tr/fashion/categories.ts` — the Turkish garment category taxonomy (elbise, üst-giyim, bluz, pantolon, takım, …). This is fashion's registered default tree, not a generic "category system" — see the caveat below.
- `src/lib/tr/fashion/types.ts` — `TrFashionProductFeatures`, `TrTakimSetItem` (garment-specific fields of the `TrProductFeatures` union — see "Product features" below).
- `src/lib/tr/fashion/{garmentUploadTypes,sizeCharts,modelMeasurements,dressFeatures,takimUpload,careInstructions}.ts` — garment upload taxonomy, cm size charts, AI-model body measurements, dress construction-chip vocabulary, two-piece "takım" set logic, wash-care copy.
- `src/lib/tr/fashion/aiCatalog/` — the elbise/takım construction, packshot, and restyle pipeline (see [08-ai-catalog-pipeline.md](./08-ai-catalog-pipeline.md) for the full AI pipeline picture, generic and fashion parts together).
- `src/lib/tr/fashion/fashn/` — the FASHN.ai garment try-on/packshot API client.
- `src/components/tr/fashion/panel/` — pure garment-construction owner-panel components (`TrOwnerElbiseConstructionGate`, `TrOwnerTakimChipsStep`, `TrOwnerAiModelPicker`, …).
- `src/components/tr/fashion/pdp/` — garment-specific PDP pieces (size chart modal, model measurements).

## Product features

`TrProductFeatures` (`src/types/tr-marketplace.ts`) is composed as `TrFashionProductFeatures & TrCustomArtProductFeatures` via `import type` from each module's own `types.ts`. This is the one place core imports from both vertical modules by design — it's a type-only composition boundary with zero runtime cost, the same pattern used by `src/lib/tr/catalog/productFeatures.ts`'s `sanitizeProductFeatures()` (a genuinely cross-vertical sanitizer, kept in `catalog/` rather than moved into either module).

## Enforcement: the ESLint boundary rule

`eslint.config.mjs` has an `import/no-restricted-paths` zone banning imports of `fashion/**` from a defined `FASHION_FREE_CORE_TARGETS` list — payments, shipping, catalogProfiles, customArt, the storefront rendering shell, auth, checkout/orders/boutiques API routes, and a handful of genuinely generic catalog files. **This list is deliberately not the whole `src/` tree** — the owner panel and the category-browsing storefront shell still import fashion internals for real, disclosed reasons (see "Known debt" below), and banning it there today would mean a long exceptions list instead of a real boundary.

If you clean up one of the areas listed under "known debt," add its directory to `FASHION_FREE_CORE_TARGETS` once it's actually clean — that's how this list is meant to grow over time. Don't add a directory to the target list that still has real fashion imports; the rule will just fail CI without fixing anything.

## Known debt (disclosed, not blocking)

- **~20 owner-panel components** (`TrProductCreateWizard`, `TrProductEditorForm`, `TrOwnerGuidedPhotoUpload`, `TrOwnerBatchCreatePage` + its steps, `TrOwnerStorePreview`, `TrOwnerProductListPage`, `TrOwnerStockPage`, `TrOwnerSizeChartStock`, `TrOwnerProductFeaturesFields`, `TrOwnerCategoryPicker`, `TrBoutiquePdpInfoSections`) interleave generic and garment-specific UI in the same file. Splitting them is a bigger, riskier job than a file move — deferred on purpose.
- **No generic category-tree abstraction.** `fashion/categories.ts` is imported directly by ~25 files across the storefront and panel, because it's the *only* category system that exists — `custom_art` has zero category concept today. Building a multi-vertical registry nobody uses yet would be premature; do it when a second vertical genuinely needs categories, not before.
- **`src/lib/tr/aiModel/elbiseTryOn.ts` and `src/lib/tr/ai/aiUsage.ts`** are garment-coupled (dress construction chips, FASHN-specific usage copy) but weren't in the original relocation's file inventory, so they're still sitting outside `fashion/`. Worth folding in on a future pass.

## Related

- Custom-art vertical (the sibling module, same pattern): [07-custom-art-module.md](./07-custom-art-module.md)
- The full AI catalog pipeline (generic + fashion-specific parts): [08-ai-catalog-pipeline.md](./08-ai-catalog-pipeline.md)
- Owner panel (where most of the "known debt" mixed components live): [05-owner-panel-commerce.md](./05-owner-panel-commerce.md)
- Storefront category browsing (the other consumer of `fashion/categories.ts`): [04-storefront-editorial-home.md](./04-storefront-editorial-home.md)
