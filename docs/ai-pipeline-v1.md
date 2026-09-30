# AI pipeline v1: archive

_Written 2026-09-30, just before the pipeline was parked (F0 of `docs/foundation-no-hardcode-plan.md`). Mert: "I don't want to just delete it, I worked on it so much. For now separate it, build a clean data architecture, then bring the AI pipeline back later."_

## Where the code is

**Archive commit: `8aba2be` on `main`**: "Merge main-t0o1c2: fashion Beden & Kategori from foundation definitions (S1, K1, K2)". It is the last commit with the full pipeline, wired in and working. `main` is never rewritten, so this commit is permanent.

To give it a name, run once from your desktop (PowerShell, inside the repo):

```powershell
git fetch origin; git tag -a ai-pipeline-v1 8aba2be -m "AI pipeline v1"; git push origin ai-pipeline-v1
```

(The cloud session can only push its working branch, so it couldn't create the tag itself.)

To read or copy a file from it later:

```powershell
git show 8aba2be:src/lib/tr/fashion/aiCatalog/listingDraft.ts
git checkout 8aba2be -- src/lib/tr/fashion/fashn   # restores the folder into your working tree
```

`docs/agent-handoffs/08-ai-catalog-pipeline.md` (as of `8aba2be`) has the earlier code map. This doc covers what the pipeline did end to end, and what to keep when it comes back.

## What it did

The pipeline turned an owner's phone photos of a garment (on a mannequin or hanger) into a finished listing:

- a clean **packshot**: ghost-mannequin for dresses, flat lay for tops and bottoms;
- **on-model photos** of a house model wearing the garment;
- a Turkish **title, description and Özellikler** drafted from the photo;
- optional **extra colours** of the same garment.

### Flows (owner panel)

| Flow | Where | Steps with AI |
|---|---|---|
| **Tek parça wizard** (`/tr/panel/urun/yeni/moda/tek-parca`) | `TrProductCreateWizard` + `TrOwnerGuidedPhotoUpload` | **Fotoğraf:**<br>1. Guided slots (front mannequin, back mannequin, optional detail) upload.<br>2. `prepare-packshot` runs the Gemini listing draft and proposes construction chips (neckline, sleeves, fit, length, decollete, rise, hem).<br>3. The owner confirms the chips in the construction gate.<br>4. FASHN packshot front + back, then Photoroom cutout, then rehosted.<br>**İsim:** the draft pre-fills title, description, features and sub-category ("AI ile doldur").<br>**Model:** FASHN try-on with a house model; dresses get 2 shots (3 with a detail photo).<br>**Extra colours:** each gets its own packshot + try-on and becomes a sibling product in a colour group. |
| **Toplu ekle** (`/tr/panel/urun/toplu`) | `TrOwnerBatchCreatePage` + steps `Photo`, `Chips`, `Listings`, `Models`, `Prices`, stock, preview | Photos for many products; each is identified (Gemini) and packshotted; chips per product; listing drafts; one model package per product; then prices and stock |
| **Takım** (`/tr/panel/urun/takim`) | `TrOwnerTakimCreatePage` + `TrOwnerTakimChipsStep` | Top and bottom photos, a packshot per piece, then **sequential try-on**: the top is dressed on the model first, then the bottom on that result (`runTakimSequentialTryOn`) |
| **Fashion editor** (`/tr/panel/urun/[id]`) | `TrFashionProductEditor` | "AI ile doldur" (`TrOwnerAiFillListing`); regenerate packshot / model shots (`TrOwnerAiCatalogEnhance`); house-model picker; colour-group linker |
| **Elbise restyle** (product list → "Packshot + model", also a bulk action) | `TrOwnerElbiseRestyleSession` / `Queue` (mounted in `TrPanelShell`) | Re-runs packshot + try-on for existing dresses in bulk (`prepareElbiseCatalogRestyle` → owner confirms chips → `commitElbiseCatalogRestyle`) |
| **Upload** (every photo upload) | `/api/tr/owner/upload` | Front/back photos got a Photoroom background removal, stored as `marketplaceUrl` (the marketplace cutout) |
| **Credits** | dashboard card `TrOwnerCreditsUsageCard`, `TrOwnerCreditsInfo` | Monthly usage from `tr_ai_usage_events` |

Every flow already had an **"Elle ekle"** switch (`TrOwnerManualListingToggle`): no AI, the owner picks category and fields and uploads the photos that are shown as-is. Products saved that way carry `features.manualListing = true`. F0 made that the only mode.

### Server API

| Route | Does |
|---|---|
| `POST /api/tr/owner/ai-catalog/prepare-packshot` | Gemini vision: listing draft + packshot prompt (`resolvePackshotPrompt`). No FASHN yet |
| `POST /api/tr/owner/ai-catalog/packshot` | FASHN packshot → Photoroom transparent PNG → rehost to tr-assets (`generateOwnerPackshot`). `maxDuration` 180 s |
| `POST /api/tr/owner/ai-catalog/listing-draft` | Gemini listing draft from one image; `colorOnly` returns just the colour (extra colours) |
| `POST /api/tr/owner/ai-model/generate` | FASHN try-on (`tryon-max`) per shot with the chosen house model; can replace one lifestyle slot. `maxDuration` 300 s |
| `GET /api/tr/owner/ai-credits` | Month-to-date credit summary for the boutique |

Client helpers for these lived in `src/lib/tr/panel/ownerClient.ts` (packshot, prepare-packshot, listing draft, model generate, credits).

## Building blocks

| Piece | Files (at `8aba2be`) | Notes |
|---|---|---|
| **FASHN client** | `src/lib/tr/fashion/fashn/client.ts` | `/v1/run` + `/v1/status` polling; credits from the `x-fashn-credits-used` header. Catalog work is pinned to the cheapest tier (`fast` + `1k` = 1 credit per output) whatever the env says |
| FASHN packshot | `fashion/fashn/packshot.ts` | Prompts per family (below); a regex strips staging words that contradict the family (hanger, visible mannequin, flat lay vs ghost mannequin) and appends a presentation lock last |
| FASHN try-on | `fashion/fashn/tryon.ts` | Product image + model plate → images; results rehosted (`rehost.ts`) because FASHN URLs expire after about 3 days |
| **Photoroom** | `src/lib/tr/ai/photoroomRemoveBg.ts` | Background removal → transparent PNG |
| **LLM switch** | `src/lib/tr/ai/resolveLlmProvider.ts` | Gemini preferred (`gemini-2.5-flash` default), OpenAI fallback; detects a Gemini key pasted into `OPENAI_API_KEY`; `ITEM_DRAFT_LLM` forces one |
| **Listing draft** | `fashion/aiCatalog/listingDraft.ts` (909 lines) | Vision call with JSON output: title, description, features, category, optional `promptExtra` for packshot staging. Turkish voice rules (`LISTING_VOICE_RULES`), sanitising, construction-aware titles (`formatConstructionProductTitle`) |
| **Construction lock** | `fashion/aiCatalog/elbiseConstructionLock.ts` | Turns confirmed chips into prompt sentences so FASHN doesn't invent sleeves, straps, slits… The single most important quality fix |
| Orchestrators | `fashion/aiCatalog/run*.ts`, `generatePackshot.ts`, `resolvePackshotPrompt.ts` | Construction packshot, elbise restyle, takım sequential try-on, colour variants |
| **House models** | `src/lib/tr/aiModel/` (`registry.ts`, `providers.ts`, `generate.ts`, `prompts.ts`, `elbiseTryOn.ts`, `resolveModelImage.ts`) | Studio models Ayla, Selin (women), Deniz (man); lilabutik's own "Lila" (blinds / flash photography styles) in `BOUTIQUE_AI_MODELS`. Plates in `public/tr/ai-models/` (15 images, 21 MB). Local plate paths are sent as data URIs because FASHN can't fetch localhost |
| Jobs | `src/lib/tr/aiCatalog/ownerAiJobQueue.ts`, `pipelineProgress.ts` | Client-side queue, 2 FASHN jobs at a time; progress items for the status strip |
| **Usage & credits** | `src/lib/tr/ai/aiUsage.ts`, `fashion/aiCatalog/uploadCostHints.ts` | Best-effort insert into `tr_ai_usage_events`. Owner pricing: 1 credit = $0.25 (≈ 12 ₺ at 47.5 ₺/$). Product package (front + back packshot) = 1 credit; each model shot = 1 credit |

### Prompts (verbatim in the archive)

- Packshot base prompts per family: `ELBISE_PACKSHOT_PROMPT` (ghost mannequin, white studio, soft shadow), `UST_GIYIM_PACKSHOT_PROMPT` and `ALT_GIYIM_PACKSHOT_PROMPT` (top-down flat lay), plus presentation locks. In `fashion/fashn/packshot.ts`.
- Try-on: `NATURAL_TRYON_PROMPT` / `NATURAL_TRYON_PROMPT_BACK`. These keep the plate's pose, light and room; a belt lock (copy the product waist exactly); a footwear lock (black pumps, never barefoot). In `aiModel/prompts.ts`.
- Studio model creation prompts (Ayla, Selin, Deniz), used to generate the plates outside the app. In `aiModel/prompts.ts`.
- Listing system prompt + voice rules: `listingDraftSystemPrompt`, `LISTING_VOICE_RULES` in `fashion/aiCatalog/listingDraft.ts`.
- Construction lock sentences: `elbiseConstructionLock.ts`.

### Environment variables

Stay set in Vercel; unused while parked:

- FASHN: `FASHN_API_KEY`, `FASHN_DEFAULT_MODE`, `FASHN_DEFAULT_RESOLUTION`
- Photoroom: `PHOTOROOM_API_KEY` (`VITE_PHOTOROOM_API_KEY` as an old fallback name)
- LLM: `GEMINI_API_KEY` / `GOOGLE_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY`, `GEMINI_MODEL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `ITEM_DRAFT_LLM`
- Model plates (optional overrides): `TR_AI_STUDIO_*` / `NEXT_PUBLIC_TR_AI_STUDIO_*`

## Data it wrote (all kept)

Nothing is removed from the database. The shop keeps showing AI-made photos exactly as before.

| Where | What |
|---|---|
| `tr_products.images` | Owner originals (mannequin / hanger shots). For AI products the shop hides them in favour of the packshot |
| `tr_products.marketplace_images` | Packshot cutouts (Photoroom PNGs) |
| `tr_products.lifestyle_images` | On-model shots (FASHN try-on, rehosted) |
| `tr_products.storefront_images` | Older storefront copies |
| `features.aiModelId`, `features.lifestyleModelIds` | Which house model made the shots. The PDP's "Model: 175 cm, S beden" line (`fashion/modelMeasurements.ts`) reads it. `boutique:lilabutik` is a persisted id: keep it valid |
| `features` construction keys | neckline, sleeves, fit, length, decollete, rise, hem… (confirmed chips) |
| `features.manualListing` | `true` for products made without AI. The shop then shows `images` as-is (`catalog/productImages.ts`) |
| `features.uploadKind = 'takim'`, `setItems` | Takım pieces |
| `features.colorGroupId`, `colorSiblingIds` | Colour groups from the extra-colour step |
| `tr_ai_usage_events` | 543 events for lilabutik (336 packshot, 207 try-on), last on 2026-08-31 |

## Lessons (from the code and its comments)

- **The construction lock is what made packshots trustworthy.** Without the confirmed chips in the prompt, FASHN invented sleeves, straps and panels. Keep "AI proposes the chips, the owner confirms, then generate".
- **One staging per family.** Ghost mannequin for dresses and flat lay for tops and bottoms. Contradicting staging words in a prompt had to be scrubbed (`UNNEGATED_*` regexes) and the presentation lock appended last.
- **The cheapest FASHN tier was good enough for catalog work.** Env bumps to 2k/4k were deliberately ignored for owner uploads.
- **Rehost everything.** FASHN output URLs expire after about 3 days.
- **Sequential try-on for sets.** Dress the top, then put the bottom on that result.
- **The house model's plate decides light and room.** The prompt must not restage it. Belt and footwear locks prevent the most common artefacts.
- **Queue client-side, 2 at a time**, so listing fields unlock while images are still generating.
- **Log usage best-effort.** A failed insert never blocks generation.

## Coming back

See §7 of `docs/foundation-no-hardcode-plan.md`. In short:

- AI returns as a **layer on top of the new data model**, writing only through the product API.
- It **proposes, and the owner accepts**.
- House models and per-kind AI settings live in the database, and there is one job table and queue.
- **Reuse:** the FASHN / Photoroom / LLM clients, the prompts, the construction lock idea, the rehost step, the credit accounting.
- **Don't reuse:** anything keyed on garment categories, `sizes`, colour groups or photo slots.
