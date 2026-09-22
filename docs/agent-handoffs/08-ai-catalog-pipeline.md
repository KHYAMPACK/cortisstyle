# 08 — AI catalog pipeline

**What this is:** the AI-assisted product-listing pipeline behind the owner panel's photo upload flow — turning a photo (or a garment on a rack) into a full listing: AI-generated title/description draft, a clean packshot, an on-model try-on image, and color variants. Almost all of the interesting logic here is fashion-specific; the generic scaffolding is thin on purpose.

## What's generic vs. fashion-specific

`src/lib/tr/aiCatalog/` now contains **only** the generic pieces:
- `ownerAiJobQueue.ts` — a promise-based concurrency limiter, no garment assumptions.
- `pipelineProgress.ts` — generic job-progress types (`PipelineJobItem`, `PipelineJobKind`, `PipelineJobStatus`).

Everything else that used to live here moved to `src/lib/tr/fashion/aiCatalog/` during the fashion-module extraction (see [06-fashion-module.md](./06-fashion-module.md)): `listingDraft.ts` (Gemini-vision listing draft generation), `elbiseConstructionLock.ts`/`elbiseRestyle.ts` (dress construction/restyle logic), `packshotPrompt.ts`/`resolvePackshotPrompt.ts` (packshot prompt building), `runConstructionPackshot.ts`, `runElbiseCatalogPipeline.ts`, `runTakimSequentialTryOn.ts`, `runColorVariantCatalog.ts` (the actual pipeline orchestrators), `uploadCostHints.ts` (garment photo-slot copy + credit costing), and the garment photo-slot labeling functions split out of `pipelineProgress.ts` into `fashion/aiCatalog/pipelineSlotLabels.ts`.

The FASHN.ai try-on/packshot API client is entirely fashion-specific and lives at `src/lib/tr/fashion/fashn/`.

**If you're adding new AI-pipeline logic:** if it references garments, chips, elbise/takım, or FASHN directly, it belongs under `fashion/aiCatalog/`, not `aiCatalog/`. The ESLint `import/no-restricted-paths` rule (see doc 06) doesn't currently cover this directory pair, so nothing will stop you from getting this wrong — it's discipline, not tooling, here.

## Providers

- **Gemini** — vision-based listing draft generation (`listingDraft.ts`), packshot prompt resolution.
- **FASHN.ai** — garment try-on and packshot generation (`fashion/fashn/`).
- **Photoroom** — background removal, genuinely generic despite living in `src/lib/tr/ai/photoroomRemoveBg.ts` (confirmed: any product photo, not garment-specific).

`src/lib/tr/aiModel/providers.ts` is the dispatch point that picks a provider per task — this is a legitimate case of core code referencing a fashion-specific provider (FASHN), the same kind of "registry dispatches to per-vertical implementation" pattern as `catalogProfiles`, not a boundary violation.

`src/lib/tr/aiModel/registry.ts` holds each boutique's AI "house model" identity (reference images, model id) for garment try-on — currently just `lilabutik`. `src/lib/tr/aiModel/elbiseTryOn.ts` is garment-specific (dress construction chips) but hasn't been relocated into `fashion/` yet — known debt, see doc 06.

## Usage / cost tracking

`src/lib/tr/ai/aiUsage.ts` tracks AI credit usage per boutique, reading copy from `fashion/aiCatalog/uploadCostHints.ts` — despite the generic-sounding name, this file is FASHN/Photoroom-specific usage logging, not a generic billing module.

## Relevant panel components

`TrOwnerGuidedPhotoUpload`, `TrOwnerBatchCreatePage` + its steps, `TrOwnerAiCatalogEnhance`, `TrOwnerColorVariantPhotos`, `TrOwnerManualListingToggle`, `TrProductColorSiblings` drive this pipeline from the panel side — all in the "mixed generic/fashion" category flagged in [05-owner-panel-commerce.md](./05-owner-panel-commerce.md). The pure-fashion pieces of this UI (`TrOwnerElbiseRestyleQueue`, `TrOwnerConstructionTriageFields`, `TrOwnerElbiseConstructionGate`, `TrOwnerAiModelPicker`) already live under `src/components/tr/fashion/panel/`.

## Code map

| Concern | Path |
|---|---|
| Generic job scaffolding | `src/lib/tr/aiCatalog/{ownerAiJobQueue,pipelineProgress}.ts` |
| Fashion pipeline orchestrators | `src/lib/tr/fashion/aiCatalog/` |
| FASHN client | `src/lib/tr/fashion/fashn/` |
| Provider dispatch | `src/lib/tr/aiModel/providers.ts` |
| Per-boutique AI model identity | `src/lib/tr/aiModel/registry.ts` |
| Background removal (generic) | `src/lib/tr/ai/photoroomRemoveBg.ts` |
| Usage/credit tracking | `src/lib/tr/ai/aiUsage.ts` |
| API routes | `src/app/api/tr/owner/ai-catalog/{listing-draft,packshot,prepare-packshot}/route.ts` |
| Reference model plates | `public/tr/ai-models/` |

## Related

- Fashion module (owns most of this pipeline): [06-fashion-module.md](./06-fashion-module.md)
- Owner panel (the UI driving this): [05-owner-panel-commerce.md](./05-owner-panel-commerce.md)
