# 06 — Sell enablement / growth (Phase 3)

**Business job:** Make boutiques **sell** — traffic, presentation, campaigns — not just “have a website.”

## What we do today

### AI catalog pipeline (owner panel)

Boutique owners polish product photos in create/edit:

**Construction catalog (live, `/tr/panel/urun/yeni`):** **Elbise**, **Üst giyim**, and **Alt giyim** share one pipeline (`isConstructionCatalogUpload` / `isConstructionCatalogCategory` in `src/lib/tr/catalog/garmentUploadTypes.ts`). Photo-first — **no Tür step**. Do **not** reuse the Photoroom + 1-shot Lila blinds/flash path. Required on-model photos **ön + arka** (`images[0..1]`), optional dekolte/detay at `images[2]`, all mirrored to `marketplaceImages` (no Photoroom on people). Packshot always stays at `images[3]` / `marketplaceImages[3]` (`ELBISE_PACKSHOT_SLOT`) — do not shift it if detay is skipped. Gemini infers family + shop leaf from ön+arka (`inferConstructionFamily`) and opens a **triage gate** (family + leaf + chips) before any FASHN call (`TrOwnerConstructionTriageFields`). Owner can skip detay and add it later; adding/removing detay must not re-run or clear the packshot. **No detay photo → do not infer Dekolte:** default Yok, hide the Detay chips, no third try-on (`constructionChipsForFamily` / `hasDetailPhoto`). If they correct a chip, Gemini rewrites `promptFront` only; **a construction lock is always stitched** from the confirmed chips (`buildElbisePackshotPrompt`) even when chips match Gemini — do not send the identify `prepared.prompt` to FASHN without that lock (batch/takım used to skip it). Strip Gemini `promptFront` when it repeats the construction base so the packshot prompt is not duplicated. **Elbise / üst giyim:** boy / yaka / kol / optional detay. **Kol is independent of yaka** (`sleeves`: Kolsuz / Kısa kol / Üç çeyrek / Uzun kol) — do not infer sleeveless from polo/yuvarlak. Straplez / ince askı / halter / tek omuz preselect Kolsuz when Kol is empty. Yaka lock no longer hardcodes sleeveless. **Boy chips differ by family** (same `features.length` key): dresses and etek use midi/maxi; tops use Crop / Normal / Uzun / Tunik boy; pantolon / eşofman use Kısa / Normal / Uzun (`BOTTOM_LENGTH_OPTIONS` in `dressFeatures.ts`). Resolver accepts all sets. Then **one** FASHN ön packshot from the front manken. **Elbise** lock white-studio ghost-mannequin + drop shadow (`ELBISE_PACKSHOT_PROMPT`). **Üst giyim and alt giyim** are **top-down flat lay** (`UST_GIYIM_PACKSHOT_PROMPT` / `ALT_GIYIM_PACKSHOT_PROMPT` + `FLAT_LAY_PACKSHOT_PRESENTATION_LOCK`) — do **not** strip “flat-lay” or stitch the ghost-mannequin presentation lock. Then **Photoroom** on that packshot only (transparent PNG last). Do not Photoroom manken photos or try-ons. Owner can **Yenile** the packshot tile only (1 kredi, same lock, no try-on). Owner uploads stay in `images` (panel / orijinaller). When `lifestyleImages` exist, shopper gallery is model shots first then packshot (`shopperFacingGallery` in `src/lib/tr/catalog/productImages.ts`); save keeps all try-on URLs (do not slice to 1) and marketplace slots beyond `images.length`. Optional **Model** step: **2** FASHN try-ons (three-quarter + back-over-shoulder) on light-grey studio plates of Ayla / Selin / Lila; **3** when a detay photo exists (elbise / üst also require the dekolte chip ≠ `Yok`; alt giyim uses the photo alone). Garment mapping: packshot → front try-on; arka manken → back try-on; detay photo → third shot. Prompt lock leads with **boy**, then family chips (`buildElbiseTryOnConstructionLock` + `constructionChipsForFamily`). Crop try-ons also lock a visible midriff; low-rise bottoms keep midriff; high-rise stays at/above the navel. Alt try-on: replace **only the bottom**, keep the plate’s top. Elbise try-on (front and back): one-piece dress — never Paça, never “replace only the bottom”. Lila blinds/flash picker is **not** used on this path. No catalog-background compositing. Credits: 1 ürün-paketi for the front packshot (charged after arka, not detay) + **1 kredi per model shot** (2 or 3). **Title formula** (`formatConstructionProductTitle` in `listingDraft.ts`): elbise `[Renk] [Boy] [Yaka] Elbise` (e.g. Siyah Midi Straplez Elbise); üst giyim `[Renk] [Yaka] [Kalıp if not Regular] [Boy if not Normal] [Kategori]` (e.g. Kahverengi Polo yaka Oversize Crop Bluz); alt giyim pants `[Renk] [Detay if photographed] [Kalıp if not Regular] [Paça if not Düz] [Kategori]`, etek `[Renk] [Detay if photographed] [Kalıp if not Regular] [Boy if not Normal] [Kategori]` (e.g. Siyah İnci işlemeli Wide İspanyol Pantolon, Siyah Slim Midi Etek, Mavi Pantolon). Bel stays a FASHN lock chip, not in the title. Detay is Gemini free text (`features.ornament`) — not a gate chip; omit when none. Omit Regular kalıp, Düz paça, Normal boy. **Üst giyim gate** also requires **Kalıp** (`features.fit`: Slim / Regular / Rahat / Oversize). **Alt giyim gate:** Boy, Bel (`features.rise`), Kalıp (Slim / Regular / Rahat / Wide); **Paça** (`features.neckHem`) on pantolon / eşofman only — **etek hides Paça** because the triage gate uses the confirmed shop leaf (`etek`), not parent `alt-giyim`. Persist a **shop leaf** from Gemini — never parent `ust-giyim` or `alt-giyim`. Owner confirms family + leaf in the triage popup (correctable later on the İsim step via `TrOwnerCategoryPicker` `parentId`). Failed identify still opens the gate empty so they can pick by hand. Editor / restyle treat a saved `bluz` / `etek` / `pantolon` as construction-catalog. Chips: `src/lib/tr/catalog/dressFeatures.ts`. Plates: `public/tr/ai-models/studio-*-three-quarter.jpg` / `*-back.jpg` and `lilabutik-lila-studio-*.jpg` (reuse for alt; bottom-specific plates are a follow-up). Shot plan: `src/lib/tr/aiModel/elbiseTryOn.ts`. Aksesuar / ev stay **yakında**.

**Elle ekle (manual listing):** Default **off**. Toggle on `/tr/panel/urun/yeni`, product editor, `/urun/toplu`, and `/urun/takim` (`TrOwnerManualListingToggle`). When on: owner picks category + chips, uploads a free gallery (max 8, at least 1), and save skips Gemini identify, FASHN packshot, Photoroom, try-on, AI fill, and restyle. Persist `features.manualListing: true` (`isManualListing` / `withManualListing` in `src/lib/tr/catalog/productFeatures.ts`). Default on-model kaydı is **Selin** (`studio:selin`, 166 cm / 59 kg, S) when no try-on model is stored — PDP “Modelin ölçüleri” (`src/lib/tr/catalog/modelMeasurements.ts`). Takım can be `uploadKind: "takim"` **and** `manualListing`. Shopper gallery then shows `images` in order (do not hide 0–2 as owner manken). Do **not** run FASHN / Gemini / Photoroom when `manualListing`. Restyle excludes these products. Drafts store optional `manualMode` (missing = off). UI: `TrOwnerManualPhotoGallery`.

**Linked colors (Renk ekle):** Construction yeni ürün can capture extra ön+arka pairs in the same session (`TrOwnerColorVariantPhotos`). Gemini chip gate still runs **once** on the primary pair. Extra colors get a color-name-only Gemini call (`draftGarmentColorFromImage` / listing-draft `colorOnly`) and **reuse the confirmed construction lock + primary `promptFront`** for packshot + 2 try-ons (`runColorVariantCatalog.ts`) — do not invent a new construction prompt per color. **Devam** on Fotoğraf waits only for a complete ön+arka pair on any started extra color — extra packshots keep running in the background (photo step stays mounted). Save still waits for extra packshots/try-ons. Extra slots show a local preview while the file uploads. Save creates **N separate products** (same slot-3 contract each) and copies the primary `aiModelId` / `lifestyleModelIds` onto extras so editor restyle/yenile works. Existing siblings missing that kaydı inherit it when the editor loads (`ensureColorSiblingLifestyleModelRecord`) or when the color group is saved. Then `POST /api/tr/owner/products/color-group` writes `features.colorGroupId` + `features.colorSiblingIds`. Price is shared; **stock is per color** on the Beden step. Review stacks one `TrOwnerStorePreview` per SKU. İsim hides the Renk text field when extras exist (color is inferred per photo). Extra photo slots accept drag-and-drop. Upload max 3 colors; editor linking max 6. PDP shows **Diğer renkler** thumbnail row (`TrProductColorSiblings`) and hides the hex-dot picker when a group exists. Restyle still only sees **that** product’s construction slots — siblings are not extra slot-3 media. Manual linking: editor Renkler step **Aynı ürün, farklı renk**. Do not silently merge two existing groups.

**Other types / legacy editor:** keep the older front/back packshot path:

1. Upload front/back → **Photoroom** cutouts (`marketplaceImages`) when `PHOTOROOM_API_KEY` is set
2. **Katalogu güzelleştir** → **Gemini** (optional) refines packshot prompt from the photo → **FASHN packshot** rehosted to `tr-assets/.../marketplace/`
3. Pick model (optional). **Lila:** choose blinds (default) or flash → **1** try-on, random pose from that style’s three plates. **Ayla/Selin/Deniz:** **1** try-on. 1 FASHN credit → `lifestyleImages`
4. Usage logged to `tr_ai_usage_events` + light owner monthly kredi summary (`GET /api/tr/owner/ai-credits`)

**Ürün yükleme draft:** Wizard state autosaves to `localStorage` (`src/lib/tr/productCreateDraft.ts`) — not a DB table. v2 is photo-first (no Tür step); v1 drafts are ignored. Includes inferred `uploadType` after the triage gate. Image URLs already live in `tr-assets`; restore is instant on reload. Clear on successful save. Photo **Sil** uses a 10s soft undo toast (no confirm modal). Construction-catalog Gemini draft includes chips (`neckline`, `sleeves`, `length`, `decollete`, `fabric`, `zipper`, `stretch`, `silhouette`, `color`, `composition`) — applied with “AI ile doldur”, stored on `tr_products.features`. Generic uploads still use `gender`, `fit`, `color`, `neckHem`, `fabric`, `composition`. Description voice is a 2-sentence elegant boutique paragraph (new uploads only). Care copy is **not** AI: `src/lib/tr/catalog/careInstructions.ts` (İçerik ve Bakım rows). Size charts: `src/lib/tr/catalog/sizeCharts.ts` — letter chart is **body cm** (S = göğüs 91 / bel 71 / basen 88; other sizes graded from S). PDP modal shows a how-to-measure silhouette (`TrBoutiqueSizeChartBodyGuide`). Numeric chart stays 1/2 garment, no body diagram. PDP kargo copy: 120 TL / 2 ürün ve üzeri ücretsiz (`FLAT_SHIPPING_FEE_KURUS`, `FREE_SHIPPING_MIN_ITEMS`) — checkout quotes the same rule.

**Toplu ürün ekle (panel):** `/tr/panel/urun/toplu` (`trPanelBatchNewProductsPath`) — same **construction catalog** as `/urun/yeni` (elbise / üst / alt), photo-first, not CSV. No Tür step: Gemini infers family + shop leaf from ön+arka (`inferConstructionFamily`). Steps: (1) ön + arka (+ optional detay) + **Sonraki ürün** — no FASHN, no Photoroom on people, no chip modal; (2) **Özellikler** review strip (family + chips) then one **Onayla — packshot üret**; (3) listings while packshots queue; (4) optional batch model — construction 2/3 try-ons, no Lila blinds/flash; (5) fiyat; (6) stock; (7) preview + **Hepsini kaydet**. Devam out of photos waits until Gemini identify finishes (`onFrontAnalysisComplete`); failed identify shows **Tekrar dene** or **Yine de devam — elle yazacağım**. Packshot/try-on stay in the client queue (concurrency 2). Save fans out `POST /api/tr/owner/products`. Draft v3: `tr:product-create-batch-draft:v2:{boutiqueId}` (`src/lib/tr/productBatchCreateDraft.ts`); v1/v2 drafts are ignored. Lib: `runConstructionPackshot.ts`. UI: `TrOwnerBatchChipsStep` (shared family + leaf picker: `TrOwnerConstructionTriageFields`). List/home CTAs: **Toplu ekle** next to **Yeni ürün**.

**Takım yükle (panel):** `/tr/panel/urun/takim` (`trPanelTakimNewProductPath`) — **not** in batch, **not** a Tür on `/urun/yeni`. One listing, shop leaf `takim`, one price. Capture is two construction items (parça 1 ön+arka, then parça 2; no detay). Gemini identify + chip gate per item, then two construction packshots (Photoroom PNG) stored at `marketplaceImages[0]` and `[1]` — **not** slot 3. Originals: `images[0..3]`. Optional model: sequential try-on (üst then alt on the same plate) → 2 lifestyle shots (both pieces together). Shopper gallery: lifestyle then both packshots (`features.uploadKind === "takim"`; `setItems` holds per-item family/chips). Exclude `takim` from `isConstructionCatalogCategory` / restyle. Editor shows thumbs only — no construction restyle. Draft: `tr:product-create-takim-draft:v1:{boutiqueId}`. Lib: `src/lib/tr/catalog/takimUpload.ts`, `runTakimSequentialTryOn.ts`. Boutique credits: 2 packshots + 2 model kareleri.

**Owner credits (boutique-facing):** generic ürün packshot package (ön+arka) = **1 kredi**; construction-catalog ön packshot only = **1 kredi**; model = **1 kredi per generated shot** (generic 1 front; elbise / üst giyim 2, or 3 with detay photo); 1 kredi = **$0.25** (`src/lib/tr/aiCatalog/uploadCostHints.ts`). Panel home shows a light month usage card; credits dialog can show the same when `boutiqueId` is passed.

**Construction restyle (existing products):** `/tr/panel/urunler` **Packshot + model** (also on a product editor, below the model picker). Skip `features.manualListing`. Re-runs the live upload pipeline on construction-catalog products (elbise, üst giyim leaf, or alt giyim leaf) that already have ön+arka manken: Gemini chip gate → FASHN ön packshot at `images[3]` / `marketplaceImages[3]` → Photoroom transparent PNG → 2/3 model try-ons into `lifestyleImages`. Construction lock is **family-scoped** (`constructionChipsForFamily`): leftover `neckHem` / collar text is not Paça on a dress; elbise try-on (including the back shot) is a one-piece dress — do not emit “replace only the bottom”. Packshot finalize keeps negated `no visible mannequin` / `no dress form` (no `no , no .`). **Also writes listing fields like a new upload:** construction title formula, Gemini description, and features (renk, yaka/kol/boy, kumaş, detay…). **Uses the model selected in the restyle sheet** (editor also passes the page picker); lock it at **Başlat** — do not silently fall back to the house model (Lila). Does not recopy hanger originals into marketplace slots 0–2. Default product selection is **today in Istanbul**. The sheet is a **panel-shell session** (`TrOwnerElbiseRestyleProvider` on `TrOwnerPanelGate`): during analiz/packshot/model the owner can dismiss it (**Arka planda devam et**); a sticky progress chip stays visible. The job lives in that page’s gate — another panel route remounts it — so while analiz / chip review / packshot / model / item error is open, sidebar and other in-panel links confirm (**İşlem devam ediyor** / **Çık ve durdur**); reload or tab close uses the browser leave prompt. The sheet **reopens for chip review, errors, or Bitti**. Lib: `src/lib/tr/aiCatalog/elbiseRestyle.ts`, `runElbiseCatalogPipeline.ts`. UI: `TrOwnerElbiseRestyleQueue`.

**FASHN API credits (platform cost):** Catalog packshot + try-on pin **`fast` + `1k` + `num_images: 1`** (`FASHN_MIN_CREDIT_*` in `src/lib/tr/fashn/client.ts`). [tryon-max](https://docs.fashn.ai/api-reference/tryon-max) at that tier is **1 credit per output** — same as [tryon-v1.6](https://docs.fashn.ai/api-reference/tryon-v1-6), which we do **not** use (lower quality). `balanced` + `1k` would be 2 credits. Do not set `FASHN_DEFAULT_MODE` / `FASHN_DEFAULT_RESOLUTION` expecting to change ürün yükleme — catalog ignores those. Typical upload: 1 packshot front + 1 packshot back + 1 optional try-on = **3 FASHN credits**.

- Try-on garment: generic Front → `marketplaceImages[0]` only. **Construction catalog (elbise / üst giyim):** packshot `images[3]` (three-quarter), arka manken `images[1]` (back), detay `images[2]` (third if dekolte chip **and** detail photo). Local studio refs are sent as data URIs when origin is localhost (FASHN cannot fetch `localhost`).
- Mağaza önizleme: packshot-only (no raw uploads); pending catalog/model slots while AI runs.

| Concern | Path |
|---------|------|
| FASHN client | `src/lib/tr/fashn/` (`packshot`, `tryon` only — not model-create) |
| Packshot prompt (heuristic + Gemini) | `src/lib/tr/aiCatalog/` (`resolvePackshotPrompt`, `packshotPrompt`) — elbise **ghost mannequin**; üst / alt **flat lay** (clothing only; never hanger / visible mannequin). Construction lock: `ELBISE_PACKSHOT_PROMPT` / `UST_GIYIM_PACKSHOT_PROMPT` / `ALT_GIYIM_PACKSHOT_PROMPT` + `buildElbisePackshotPrompt` |
| Construction upload type / chips | `src/lib/tr/catalog/garmentUploadTypes.ts`, `dressFeatures.ts` |
| Takım (two-piece set) | `takimUpload.ts`, `productTakimCreateDraft.ts`, `TrOwnerTakimCreatePage` — `/tr/panel/urun/takim` |
| Linked colors | `colorSiblings.ts`, `syncColorGroup.ts`, `runColorVariantCatalog.ts` — `POST /api/tr/owner/products/color-group`; PDP `TrProductColorSiblings` |
| Try-on / model registry | `src/lib/tr/aiModel/` (`registry`, `prompts`, `providers`, `elbiseTryOn`) |
| Usage log | `src/lib/tr/aiUsage.ts`, `supabase/patch_tr_ai_usage.sql`, `GET /api/tr/owner/ai-credits` |
| APIs | `POST /api/tr/owner/ai-catalog/packshot`, `POST /api/tr/owner/ai-model/generate` |
| Panel UI | `TrOwnerAiCatalogEnhance`, `TrOwnerAiModelPicker`, product wizard + editor, batch create (`TrOwnerBatchCreatePage`, photo-first steps) |

**FASHN limitation:** Try-On API has **no** default models — `model_image` is required. Studio “Starter Models” are UI-only (not API IDs). **FASHN is packshot + try-on only.** House/studio plates are one-time Cursor image gens in `public/tr/ai-models/`. Do not call `model-create`.

**Studio models (always available):**
- `studio:ayla` (woman) → `public/tr/ai-models/studio-ayla.jpg` plus elbise plates `studio-ayla-three-quarter.jpg` / `studio-ayla-back.jpg`
- `studio:selin` (woman) → `public/tr/ai-models/studio-selin.jpg` plus elbise plates `studio-selin-three-quarter.jpg` / `studio-selin-back.jpg`
- `studio:deniz` (man) → `public/tr/ai-models/studio-deniz.jpg` (or env override). No back plate — elbise try-on falls back to the front plate only.
- Locked try-on prompts: `src/lib/tr/aiModel/prompts.ts` (`NATURAL_TRYON_PROMPT`) — keep plate pose/lighting/background; no invented pockets / hands-in-pockets; **keep product belts/loops when present** (do not list `belts` in the invent-deny list — FASHN treats that as “no belt”); **never barefoot** (closed-toe black pumps from the plate). Construction rise lock is `Waist/rise (bel)` — not `Bel/rise` (reads as belt). Elbise adds `buildElbiseTryOnConstructionLock` (length first). Per-shot **Bu kareyi yenile** uses `features.lifestyleModelIds[i]` (the model that produced that frame). **Modeli değiştir** is the only path that picks a new person for all shots. Do not auto-default yenile to the house model.
- Boutique extras: add a row in `BOUTIQUE_AI_MODELS` in `registry.ts` — **no** owner upload/create UI
  - **Lila Butik** (`lilabutik`): house model **Lila** — six full-body plates (`LILABUTIK_LILA_TRYON_REFS_BY_STYLE`: blinds + flash × front / three-quarter / hands-behind) for **non-elbise** try-on. Owners pick **blinds (default) or flash**, not the pose. Pipeline runs **one** 1-credit try-on on a random plate from that style. **Elbise** ignores blinds/flash and uses `lilabutik-lila-studio-three-quarter.jpg` + `lilabutik-lila-studio-back.jpg` (`getElbiseTryOnPlates`).
  - Pervin row exists but refs empty until portrait shoot

**Env (local + Vercel):** `FASHN_API_KEY` (packshot + try-on only), `PHOTOROOM_API_KEY`, `GEMINI_API_KEY` (or `GOOGLE_API_KEY`). Optional: `FASHN_DEFAULT_RESOLUTION`, `FASHN_DEFAULT_MODE` (unused by catalog — packshot/try-on is always fast+1k), `NEXT_PUBLIC_TR_AI_STUDIO_AYLA_REF_URLS`, `NEXT_PUBLIC_TR_AI_STUDIO_SELIN_REF_URLS`, `NEXT_PUBLIC_TR_AI_STUDIO_DENIZ_REF_URLS` (override hosted public paths).

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
| Panel | `/tr/panel/icerik` (`TrOwnerContentPage`, `TrOwnerContentPackPage`) — **not** in primary sidebar nav (`TR_PANEL_NAV`). Route stays; coming-soon until pack UI ships. |
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
- WhatsApp CTA as interim conversion when checkout is off

## What we will do / direction

- **Image formats (live):** boutique + Cadde packshots are marketplace PNG; originals + on-model are WebP q95. Do not bake a sibling storefront WebP. [15-boutique-storefront-image-formats.md](./15-boutique-storefront-image-formats.md).
- Boutique-facing credit wallet / ₺ packages + overage (metering table already exists)
- Fill boutique house model `referenceImageUrls` in `registry.ts` after in-shop shoots (manual; no owner UI). Do not use FASHN `model-create`.
- Studio Ayla/Selin/Deniz are platform defaults — regenerate as Cursor image gens into `public/tr/ai-models/`, not via FASHN
- Reels / image-to-video once still → link → checkout is measured
- Optional Meta schedule/publish
- Featured looks / paid homepage placement (marketplace concept later revenue)

## Agent rules of thumb

- Prefer **registries** for models/backgrounds/aspects (implementation principles).
- Don’t build a generic ads manager unless the task asks — extend content packs and catalog quality first.
- **Kampanyalar** = discounts (in primary nav); **İçerik** = social sell packs (route `/tr/panel/icerik` exists, **not** in `TR_PANEL_NAV`). Keep them separate.
- Demo AI registry entries may have empty asset URLs — wire assets via config, don’t fake production.
- Content pack deep links use `utm_source=instagram&utm_medium=content_pack` (see `buildContentPackDeepLink`).
- Growth copy/ops live in `docs/`; product code should stay modular and measurable.
- Apply `patch_tr_content_packs.sql` and `patch_tr_ai_usage.sql` before relying on pack / usage persistence in a given environment.
- Re-host FASHN CDN outputs immediately (they expire ~3 days).
