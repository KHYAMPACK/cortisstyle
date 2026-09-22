# 17 — Generic foundation + fashion module extraction

**Status (2026-09-22):** In progress. Phases 1–4 done, phase 5 next. This doc is the living reference for the effort — update it as phases land, per the repo's own convention (`.cursor/rules/document-structural-changes.mdc`).

## Why

Cortisstyle started as a single-vertical (fashion/apparel) marketplace, and that assumption got baked into code that *sounds* generic (`catalog/`, `products.ts`, `categories.ts`) without actually being generic. Mert wants the platform to become a solid, generic store-builder foundation (in the spirit of ikas) that can support *any* product type, with fashion-specific behavior split into a self-contained module — so a bug or change in the fashion module can never break the generic core, and a second vertical becomes additive instead of another round of scattered `if (fashion)` branches.

This is not a request for new features — the opposite: strip the core down to what's actually generic, relocate fashion-specific code behind a clean boundary, and purge anything that doesn't serve either the generic architecture or lilabutik's live operation. **Standing rule for this effort: if removing something doesn't break lilabutik, it's fair game to delete outright**, not just move — the end state is "a solid generic foundation, with lilabutik running on it via the fashion module."

## Current-state findings (verified by direct code reading, Sep 2026)

**Scope correction:** `studio/`, the LLM item-draft pipeline (`scripts/generate-item-draft.mts`), and several docs that look fashion-archive-related actually live in a **separate sibling repo, `cortisstyle-international`** — confirmed by `ls` (no `studio/` directory in this repo) and by directory listing (`cortisstyle-international` exists as a sibling of `cortisstyle`). They are out of scope for this repo entirely.

**A real module-boundary pattern already exists, but only for `custom_art`:**
- `src/lib/tr/catalogProfiles/types.ts` — `TrCatalogProfileId = "fashion" | "custom_art"`, a `TrCatalogProfileCapabilities` struct (`showProductsNav`, `showStockNav`, `allowProductRoutes`, `pdpLayout`, `skipStockValidation`, `skipInventoryDecrement`, etc.)
- `src/lib/tr/catalogProfiles/registry.ts` — one capabilities object per profile + `resolveCatalogProfile()` / `isCustomArtCatalogProfile()` / `catalogProfileCapabilities()`.
- Consumed consistently across 29 files (checkout validation, PDP layout, owner panel nav, product route gating) — this is a real, used pattern, not scattered string comparisons.
- `custom_art`'s own logic is cleanly isolated in `src/lib/tr/customArt/` (pricing, reference assets, upload client/rate-limit) — **this is the reference implementation** the fashion-module extraction should mirror. Keep it; it's the second data point proving the module pattern works, not a purge candidate.
- It's a **capability-flags pattern, not a full plugin architecture**: one enum, one flags struct, no per-vertical registered handler classes. `TrProduct`/`TrProductFeatures` and `tr_products` are shared unmodified by both profiles today.

**"Fashion" was never extracted the same way** — it was the original, unmarked default, so garment logic is scattered *undifferentiated* inside otherwise-generic folders:

| Area | Universal / generic | Clothing-specific |
|---|---|---|
| `TrProduct` core type (`src/types/tr-marketplace.ts`) | `id`, `title`, `description`, `priceKurus`, `images`, `stock`, `status`, timestamps | `size`/`sizes`/`sizeStocks`, `features.{neckline,sleeves,fit,neckHem,fabric,composition,rise,ornament,zipper,stretch,silhouette}`, `uploadKind:"takim"` + `setItems` (family: `elbise\|ust-giyim\|alt-giyim`), `lifestyleImages`/`aiModelId` (assumes garments on AI human models) |
| `src/lib/tr/catalog/` (23 files) | `boutiques.ts`, `products.ts`, `productOptions.ts`, `productImages.ts`, `recommendations.ts`, `publicData.ts` | `dressFeatures.ts`, `garmentUploadTypes.ts`, `sizeCharts.ts` (hardcoded body measurements), `modelMeasurements.ts`, `careInstructions.ts`, `midiJeanTwins.ts`, `takimUpload.ts` |
| `src/lib/tr/aiCatalog/`, `aiModel/` | model-registry plumbing (`aiModel/providers.ts`) | `elbiseConstructionLock.ts`, `elbiseRestyle.ts`, `runElbiseCatalogPipeline.ts`, `runTakimSequentialTryOn.ts`, `runConstructionPackshot.ts`, `packshotPrompt.ts` |
| `src/lib/tr/fashn/` (6 files) | — | entirely garment try-on (`client.ts`, `modelCreate.ts`, `packshot.ts`, `tryon.ts`, `rehost.ts`) |
| `src/lib/tr/ai/photoroomRemoveBg.ts` | genuinely generic (any product photo background removal) despite the garment-flavored name | — |
| Categories (`src/lib/tr/catalog/categories.ts`) | — | **fully hardcoded** Turkish apparel taxonomy (`elbise`, `üst-giyim`, `bluz`, `pantolon`, `takim`, ...), zero abstraction between "category system" and "clothing taxonomy" — every product's `category` resolves against this one tree regardless of vertical |
| Owner panel product pages (`src/app/tr/panel/urun/*`, `TrProductCreateWizard.tsx`, `TrProductEditorForm.tsx`) | title, description, price, stock, image slots | garment upload types, Turkish category tree, `TrOwnerSizeChartStock` (letter XS–3XL or numeric 24–40 only), `TrOwnerProductFeaturesFields` (neckline/sleeves/decollete/rise/zipper/stretch/silhouette/fabric/composition), color-siblings-by-Turkish-name, "takım" 2-item fixed photo slots |
| Batch-create pipeline (`productBatchCreateFlow.ts`) | step scaffolding (photos→chips→listings→models→prices→stock→preview) | hardcoded to garment photo→AI packshot→try-on; `ProductBatchCreateRow` bakes in `sizeChart`/`sizeStockInputs`/construction `gateChips` directly on the row type, not a generic attribute bag |
| Size/color presets (`tr_boutiques.size_presets`/`color_presets`) | DB schema itself is generic (string labels + hex) | only two axes exist (size, color); defaults are `DEFAULT_LETTER_SIZES` (XS–3XL) and a fixed Turkish color list; no general variant/option-type system |

**The database schema is already mostly generic** — `tr_products.features` is a flexible `jsonb` column. The coupling above is a TypeScript-type and code-organization problem, not a schema problem, so most of this refactor can happen without a migration.

**Directory-level scope**, for calibrating how big the physical-relocation phase (6) actually is: of ~38 top-level directories under `src/lib/tr/` + `src/components/tr/`, only `fashn/`, `looks/`, `outfitFrame/` are fashion-named at the top level (~8%) — the rest are generic nouns (`catalog`, `payments`, `shipping`, `panel`, `storefront`, ...). The fashion coupling is concentrated in ~30 files *inside* those generic-named folders (`catalog/`, `aiCatalog/`, `panel/`, `boutique/pdp/`) plus all of `fashn/` — so phase 6 is a targeted file-level extraction, not a directory-level rewrite.

## Target architecture

**Core (generic, vertical-agnostic):** tenant/boutique model, auth, checkout/orders, payments & shipping registries (already DB-backed and provider-agnostic post Phase-1), storefront rendering shell, the `catalogProfiles` capability-registry mechanism itself, and `TrProduct`'s universal fields only. A generic, pluggable category-tree concept with no built-in taxonomy — each vertical module registers its own tree.

**Fashion module (`src/lib/tr/fashion/`, mirroring `customArt/`):** garment `features` types, the Turkish category taxonomy (moved here as fashion's registered default), size charts, model measurements, garment upload types, "takım" logic, all of `fashn/`, the `aiCatalog/` construction/packshot/restyle pipeline, and fashion-specific panel/PDP components.

**Enforcement:** an ESLint import-boundary rule (lightweight directory convention, no workspace split) preventing core code from reaching into `fashion/` internals — added once the module is physically isolated (phase 7).

## Purge scope

- **Non-lilabutik boutique-specific code**: `pervinsoysalbutik`, `demo-maya`, `newtenant` (`src/components/tr/boutique/newtenant/`) branches and components. Not load-bearing for lilabutik or the architecture.
- **Dead/legacy code** already flagged in `docs/codebase-cleanup-audit.md` but not yet removed, plus anything phases 4–6 turn up as orphaned.
- `custom_art`/minimora: **keep the module** (reference implementation); minimora's specific branding/content is purgeable if unwanted — flagged, not yet decided.

## Phased roadmap

1. ✅ Finish in-flight Phase-1 payments async refactor (unrelated to this effort, just needed closing out first).
2. ✅ Doc cleanup — deleted 9 docs confirmed stale for this repo (see commit `6aca0d5`), fixed dangling references.
3. ✅ **Purged non-lilabutik, non-architectural boutique code** (see commit `217eca9`). newtenant and pervinsoysalbutik got full teardown — code *and* their `tr_boutiques` rows deleted (Pervin had 6 sandbox-only test orders, confirmed zero real invoices before deleting those too). demo-maya's demo-content code was removed, but its shared types (`EditorialDemoContent` etc.) and stock-photo asset paths turned out to be load-bearing for every editorial-skin boutique including lilabutik — kept those. Only `lilabutik` and `minimora` (the `custom_art` reference module) remain in `tr_boutiques`.
4. ✅ **Relocated the category taxonomy into `src/lib/tr/fashion/categories.ts`** (see commit `3381b69`). Course-corrected from a "per-catalog_profile registry" — checked first and found `custom_art` has zero category usage today (one seeded product, no Ürünler/Stok panel), so a multi-vertical registry would have been an unused abstraction. Just moved the file and updated all 29 importers to the direct path instead (deleted the old shim) — makes the fashion-coupling visible without inventing a mechanism nothing uses yet. Verified every importer is catalog-browsing/panel UI, none of it touches checkout/payments/shipping/tenant management.
5. ⬜ Split `TrProductFeatures` by vertical (types only, no DB migration).
6. ⬜ Physically relocate fashion-specific files into `src/lib/tr/fashion/`, in small batches.
7. ⬜ Add the ESLint import-boundary rule.

## Judgment calls during execution

Not every decision is nailed down up front — this is deliberately a roadmap, not a full spec. Per Mert's instruction: when a genuine judgment call comes up (is this file fashion-specific or ambiguous, does this dead code truly have zero callers, should this purge candidate really go), stop and ask rather than guess.

## Verification

- After each phase: `npx tsc --noEmit`, `npm run build`, targeted grep for dangling imports to moved/deleted files.
- Spot-check lilabutik's live storefront, PDP, checkout, and owner panel after any phase touching shared code paths.
- After phase 6 specifically: exercise owner panel product creation, batch-upload, and takım flows in the browser.

## Related

- Custom-art vertical (the reference module): [16-custom-art-boutique.md](./16-custom-art-boutique.md)
- Where TR code lives generally: [14-tr-codemap.md](./14-tr-codemap.md)
- Phase 1 (tenant config → DB) that this builds on: `docs/phase1-tenant-config-plan.md`
