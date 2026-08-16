# 06 — Sell enablement / growth (Phase 3)

**Business job:** Make boutiques **sell** — traffic, presentation, campaigns — not just “have a website.”

## What we do today

### AI catalog pipeline (owner panel)

Boutique owners polish product photos in create/edit:

1. Upload front/back → **Photoroom** cutouts (`marketplaceImages`) when `PHOTOROOM_API_KEY` is set
2. **Katalogu güzelleştir** → **Gemini** (optional) refines packshot prompt from the photo → **FASHN packshot** rehosted to `tr-assets/.../marketplace/`
3. Pick model (optional) → **1** try-on from front packshot → `lifestyleImages`
4. Usage logged to `tr_ai_usage_events` + light owner monthly kredi summary (`GET /api/tr/owner/ai-credits`)

**Ürün yükleme draft:** Wizard state autosaves to `localStorage` (`src/lib/tr/productCreateDraft.ts`) — not a DB table. Image URLs already live in `tr-assets`; restore is instant on reload. Clear on successful save. Photo **Sil** uses a 10s soft undo toast (no confirm modal).

**Owner credits:** ürün packshot package (ön+arka) = **1 kredi**; model (1 front shot) = **1 kredi**; 1 kredi = **$0.25** (`src/lib/tr/aiCatalog/uploadCostHints.ts`). Panel home shows a light month usage card; credits dialog can show the same when `boutiqueId` is passed.

- Try-on garment: Front → `marketplaceImages[0]` only. Local studio refs are sent as data URIs when origin is localhost (FASHN cannot fetch `localhost`).
- Mağaza önizleme: packshot-only (no raw uploads); pending catalog/model slots while AI runs.

| Concern | Path |
|---------|------|
| FASHN client | `src/lib/tr/fashn/` (`packshot`, `tryon`, `modelCreate`) |
| Packshot prompt (heuristic + Gemini) | `src/lib/tr/aiCatalog/` (`resolvePackshotPrompt`, `packshotPrompt`) |
| Try-on / model registry | `src/lib/tr/aiModel/` (`registry`, `prompts`, `providers`) |
| Usage log | `src/lib/tr/aiUsage.ts`, `supabase/patch_tr_ai_usage.sql`, `GET /api/tr/owner/ai-credits` |
| APIs | `POST /api/tr/owner/ai-catalog/packshot`, `POST /api/tr/owner/ai-model/generate` |
| Panel UI | `TrOwnerAiCatalogEnhance`, `TrOwnerAiModelPicker`, product wizard + editor |

**FASHN limitation:** Try-On API has **no** default models — `model_image` is required. Studio “Starter Models” are UI-only (not API IDs). Platform refs are generated once with **`model-create`** and hosted under `public/tr/ai-models/`.

**Studio models (always available):**
- `studio:ayla` (woman) → `public/tr/ai-models/studio-ayla.jpg` (or `TR_AI_STUDIO_AYLA_REF_URLS` / `NEXT_PUBLIC_…`)
- `studio:deniz` (man) → `public/tr/ai-models/studio-deniz.jpg` (or env override)
- Locked prompts: `src/lib/tr/aiModel/prompts.ts` (`NATURAL_TRYON_PROMPT`, Ayla/Deniz `model-create` prompts) — simple room (wall + floor), no void; no invented pockets / hands-in-pockets; regenerate refs with `npm run tr:generate-studio-models`
- Regenerate refs: `npm run tr:generate-studio-models` (needs `FASHN_API_KEY`)
- Boutique extras: add a row in `BOUTIQUE_AI_MODELS` in `registry.ts` — **no** owner upload/create UI
  - **Lila Butik** (`lilabutik`): house model **Lila** → `public/tr/ai-models/lilabutik-lila.jpg` (`boutique:lilabutik`) — same woman as storefront campaigns; auto-selected as default for that tenant only
  - Pervin row exists but refs empty until portrait shoot

**Env (local + Vercel):** `FASHN_API_KEY`, `PHOTOROOM_API_KEY`, `GEMINI_API_KEY` (or `GOOGLE_API_KEY`). Optional: `FASHN_DEFAULT_RESOLUTION`, `FASHN_DEFAULT_MODE`, `NEXT_PUBLIC_TR_AI_STUDIO_AYLA_REF_URLS`, `NEXT_PUBLIC_TR_AI_STUDIO_DENIZ_REF_URLS` (override hosted public paths).

If Gemini is missing or fails, packshot still runs with the heuristic default prompt.

**Credits:** Platform FASHN balance (your API key). Internal `tr_ai_usage_events` for later boutique packages — apply `patch_tr_ai_usage.sql` manually.

### Content packs (owner self-serve)

Boutique owners generate Instagram-ready **İçerik** packs from catalog products:

1. Pick a product with a marketplace cutout / packshot
2. Attempt AI on-model variants (`src/lib/tr/aiModel` → FASHN when configured) — fall back to cutouts when stub / not configured
3. Persist pack + merge successful AI URLs into `lifestyleImages` on the product
4. Owner downloads stills (1:1, 4:5, 9:16 crop previews), copies Turkish caption + UTM deep link, posts manually on Instagram

| Concern | Path |
|---------|------|
| Lib | `src/lib/tr/contentPacks/` |
| Panel | `/tr/panel/icerik`, `TrOwnerContentPage`, `TrOwnerContentPackPage` |
| API | `GET/POST /api/tr/owner/content-packs`, `GET …/content-packs/[id]` |
| Schema | `supabase/patch_tr_content_packs.sql` (`tr_content_packs`, `tr_products.lifestyle_images`) |

**Not in foundation:** Reels/video, Meta Graph publish, Ads Manager, trend scraping, look-based multi-SKU packs.

### Catalog sell-quality

- Cutout / marketplace images, catalog backgrounds registry, image normalize/upload pipeline
- AI packshot + on-model helpers above
- Product `lifestyleImages` for PDP / future merchandising

### Campaigns & growth ops

- Owner discount codes / **Kampanyalar** (merchant promos — not an ad network)
- International affiliate monetization (Phase 3-adjacent traffic)
- TikTok / social playbooks: `docs/tiktok-content-ruleset.md`, `docs/social-account-setup.md`
- WhatsApp CTA as interim conversion when checkout is off

## What we will do / direction

- **Image formats (later):** boutique originals + on-model (background photos) → WebP/JPEG; packshot cutouts stay PNG for Cadde + on-model input. Plan: [15-boutique-storefront-image-formats.md](./15-boutique-storefront-image-formats.md).
- Boutique-facing credit wallet / ₺ packages + overage (metering table already exists)
- Fill boutique house model `referenceImageUrls` in `registry.ts` after in-shop shoots (manual; no owner UI)
- Studio Ayla/Deniz are platform defaults — regenerate with `npm run tr:generate-studio-models` if needed
- Reels / image-to-video once still → link → checkout is measured
- Optional Meta schedule/publish
- Featured looks / paid homepage placement (marketplace concept later revenue)

## Agent rules of thumb

- Prefer **registries** for models/backgrounds/aspects (implementation principles).
- Don’t build a generic ads manager unless the task asks — extend content packs and catalog quality first.
- **Kampanyalar** = discounts; **İçerik** = social sell packs. Keep them separate.
- Demo AI registry entries may have empty asset URLs — wire assets via config, don’t fake production.
- Content pack deep links use `utm_source=instagram&utm_medium=content_pack` (see `buildContentPackDeepLink`).
- Growth copy/ops live in `docs/`; product code should stay modular and measurable.
- Apply `patch_tr_content_packs.sql` and `patch_tr_ai_usage.sql` before relying on pack / usage persistence in a given environment.
- Re-host FASHN CDN outputs immediately (they expire ~3 days).
