# lilabutik → product upload foundation — migration plan

_Prepared 2026-09-29 on branch `main-t0o1c2`. This is a **plan**, not built. Nothing here has been started, and nothing is to be started without Mert's explicit go-ahead per work item. Facts below were checked against the repo at `33e85a0` and against the live Supabase project (`qjxclaggqzhfaqihwdle`) with **read-only `SELECT`s only** the same day — no DDL, no writes._

Inputs: `docs/product-upload-foundation-plan.md` (all of it, esp. Status, §4 save model, §8 variants, §8.5 "coexist first"), `agent-handoffs/03`, `05`, `06`.

## Status

Nothing built. Three independent work areas, each split into milestones that ship on their own:

| Area | What | Risk | Needs storefront freeze lifted? | Recommended |
|---|---|---|---|---|
| **A — Fashion editor on shared blocks** | Rebuild `TrProductEditorForm` from the shared editor pieces + manual save; the create wizard gets a much smaller pass | **Medium**: panel-only, but it writes lilabutik's live product rows | **No** | **Do first** |
| **B — Fashion Beden/Renk onto variant types** | Move `sizes`/`size_stocks` (+ colour groups) onto `tr_variant_types`/`tr_product_variants` | **High**: ~35 storefront/checkout/order/feed files, all 93 sized lilabutik products, live inventory | **Yes, broadly** | **Defer.** Revisit only after M7c-2/M7c-3 ship and a Gelişmiş product has sold through the real shop |
| **C — Per-slug code touches → DB** | Editorial skin, email logo, AI try-on persona, carrier integration (+ two touches doc 03 misses) | **Low to high** per item | Some items yes (skin, favicon, carrier) | Email logo now; carrier with roadmap P4-T2; skin/favicon when a second real store onboards; AI persona stays manual ops |

### Environment caveat

`node_modules/` is **not installed** in this checkout, so `node_modules/next/dist/docs/` (AGENTS.md) could not be read while planning. Nothing in this plan depends on a new framework API: it reuses patterns already in the repo (`next/dynamic` with `ssr: false`, client panel pages, route handlers). But the first build step of each milestone must still `npm install` and read the relevant Next docs before writing code.

## 0. What is live, verified 2026-09-29

From read-only queries on production:

| Fact | Value | Why it matters |
|---|---|---|
| Boutiques | `lilabutik` (94 products, live, custom domain) and `deneme-butik` (1 product, intentional test boutique) | Doc 03 still says "exactly one boutique exists". That's small drift to fix alongside this work. `deneme-butik` is the test bed for everything below |
| lilabutik `product_type` | 94 × `fashion`, 0 × simple/advanced | Every lilabutik product goes through the editor in Area A |
| Products with sizes | 93/94. Charts: letter `XS…3XL` (55), letter `XS…XL` (11), numeric `24…52` (16), `24…40` (10), a `24…52` without `44` (1), no sizes (1) | Area B would need to map five distinct size lists |
| Products with a `colors` array | **2**/94 | The on-product colour picker is almost unused |
| Products in a colour group (`features.colorGroupId`) | **28** products in **12** groups | "Renk" on lilabutik is mostly *separate products linked by a group*, not an option on one product. This decides much of Area B |
| `features.aiModelId = 'boutique:lilabutik'` | 4 products | This id string is persisted data; Area C must not rename it |
| `description_html` / `slug` set | 0 / 0 | lilabutik is fully on the pre-M2/M4 shape. The fashion PDP doesn't render `description` at all; it only feeds meta, feed and AI fill |
| Order items | 28 total: 27 with `size`, 0 with `variant_id` | The variant sale path (M7c-1) has **never** run on a real order |
| Variant types / variants | 1 / 0 | Gelişmiş isn't in real use anywhere |
| `tr_boutique_integrations` rows | 1 (lilabutik iyzico) | The carrier is not in the table yet |

## Decisions (Mert, 2026-09-29)

| Q | Decision |
|---|---|
| 1 | **Go on Area A**, and A3 (new editor as default for lilabutik) gets its own explicit go-ahead after the staff-flag period |
| 2 | **Switch lilabutik's fashion editor from autosave to manual save** (Kaydet + leave guard) |
| 3 | **SEO card on fashion products = option (b):** Sayfa başlığı / Açıklama / noindex, **no slug field**, so lilabutik's product URLs and canonicals don't change |
| 5 | **Durum is derived from stock**, like Basit: the owner picks Satışta or Gizli; "Satıldı" is shown when stock is 0. Replaces D3. Verified safe on live data: no lilabutik product is `sold` today (61 `available` + 33 `hidden`, all with stock > 0), so no existing product changes status on its first save |
| 4 | **Fix the all-sizes-zero bug** (§A.1) in A0/A2: typing 0 in every size saves zero stock, and with Q5 the product then shows as sold out. Needed anyway for Q5 to work. Live data today: 0 lilabutik products have all sizes at zero, 0 have an empty size map, and 0 have a `stock` that differs from the sum of their sizes, so the fix changes no existing row |
| 7 | **Area B deferred** (as recommended in §B.3) |
| 8 | **lilabutik's colour-group products are never merged into Renk variants** |
| 9 | **Option (a):** SVG-only stores are asked for a PNG logo at onboarding (add a line to `docs/tr-boutique-intake-template.md` when C.2 ships). No `email_logo_url` column. C.2's map removal still goes ahead |
| 10 | **On hold:** editorial skin / favicon / brand no-DB paths (C.1, C.5, C.6) aren't scheduled. Revisit when asked |
| 12 | **AI persona stays manual per-boutique ops work.** Only the de-Lila rename inside shared panel code (C.3) is done, together with Area A |

| 6 | **No extra fields for fashion products.** A4's Alış fiyatı / Tedarikçi-HS / Envanter / Ürün detayı cards are dropped. (Whether this also drops the SEO card from Q3 is being confirmed with Mert) |
| 11 | **Carrier (C4) waits** until a second store wants automatic labels. When it runs, Mert has approved lifting the storefront freeze for its checkout/PDP step (C4d) as its own scoped exception |

All questions answered. Nothing is built until Mert says to start.

## 1. Decisions I'm assuming (change any of these)

| # | Topic | Assumption | Why |
|---|---|---|---|
| D1 | §8.5 "coexist first" | **Respected.** Area A doesn't touch the size model. Area B is planned but recommended *deferred*, with preparatory steps that leave the stored data alone | §8.5's reasons still hold, and the live data (28/94 colour-grouped products, zero real variant sales) strengthens them |
| D2 | Fashion editor save model | Manual save (Kaydet, Ctrl+S, leave guard), per 05's panel-wide rule. AI actions that already persist server-side (restyle, colour-group link, AI enhance) stay **actions** that apply immediately | Autosave is the named exception in 05. The AI flows spend paid credits and already write through their own endpoints |
| D3 | Durum in the fashion editor | **Superseded by Mert's Q5 answer: derived from stock (Satışta/Gizli + sold at 0).** Original assumption: stays an **explicit three-way owner choice** (Satışta / Satıldı / Gizli), saved with Kaydet like every other field. It is *not* derived from stock the way Basit does it | Changing how lilabutik's owner marks a garment "Satıldı" is a behaviour change nobody asked for. Today's status chips save instantly as an action; moving them into the form is the only change |
| D4 | Açıklama in the fashion editor | Stays the **plain textarea** writing `description`. No rich-text field for fashion in Area A | `description` feeds lilabutik's meta description, Google feed and AI fill. Rich text would start writing `description_html` and re-deriving `description`, changing whitespace in live meta/feed text. The fashion PDP renders neither |
| D5 | New cards for fashion (SEO, Ürün detayı, Envanter, Alış fiyatı) | **Not in the parity rebuild (A2).** Offered as a separate opt-in milestone (A4) needing Mert's yes | Parity first. Each card has its own live consequence (a slug changes a canonical URL; SKU/brand feed nothing yet) |
| D6 | Where the new editor lives | `src/components/tr/fashion/panel/TrFashionProductEditor.tsx` plus pure rules in `src/lib/tr/fashion/productForm.ts`. Core's `TrOwnerEditProductPage` picks it through a registry slot, not a direct fashion import (§A-boundary) | Keeps the ESLint boundary meaningful and lets the dispatcher eventually join `FASHION_FREE_CORE_TARGETS` |
| D7 | Create wizard (`TrProductCreateWizard`) | **Not rebuilt.** It already saves explicitly: its "autosave" is a **localStorage draft** (`productCreateDraft.ts`), not a server autosave. It only shares the payload builder and toasts | The wizard is a multi-step, paid-AI, multi-product flow (colour siblings + group). Rebuilding it is a large risk for no model gain. 05's "the wizard autosaves" should be corrected to say "keeps a local draft" |
| D8 | Rollout switch | Old and new editors live side by side. The new one is opened by a staff-only query flag first, then made the default, then the old one is deleted one release later | lilabutik's owner never meets a half-finished editor, and rollback is a one-line revert |

## Area A — Fashion editor on the shared foundation

### A.1 What's true today (verified)

- `TrProductEditorForm.tsx` (1,482 lines) edits every lilabutik product.
  - **It autosaves:** a 700 ms debounced full-payload `PATCH` on every change.
  - **Durum is saved separately** as an immediate action (`persistStatus`).
  - **It re-implements generic pieces:**
    - Title with counter.
    - Price with an "İndirim var mı?" toggle, which is a different price UX from Basit's Satış/İndirimli fields.
    - Status chips.
    - A delete card, a duplicate of Basit's.
    - Its own inline error box instead of toasts.
    - A local `slugifyCustomId`, a third Turkish slugifier.
- `TrSimpleProductEditor.tsx` (831 lines) composes:
  - Layout and save: `TrPanelEditor*`, `TrPanelEditorSave`, `useUnsavedChangesGuard`.
  - Media: `TrOwnerManualPhotoGallery`.
  - Detail cards: `TrPanelCreatableSelect`/`TagsField`, `TrPanelSeoCard`, `TrPanelCategoryPicker`, `TrPanelRichTextField`.
  - Feedback: `toast`.
  - Form logic: the pure `simpleProductForm.ts`, whose PATCH sends **only the fields that editor owns**.
- **The fashion editor's PATCH sends everything, every time:** `features`, `images`, `marketplaceImages`, `lifestyleImages`, `category`, `sizes`, `colors`, `status`… This is exactly why autosave interacts badly with the AI flows. They save server-side, then the editor has to reset its fingerprint (`lastSavedFingerprintRef.current = null`) so its next autosave doesn't write stale state back.
- **Apparent latent bug (verify at build time, don't reproduce blindly):**
  - **What happens:** when every size's stock is typed as 0, `buildPayload` sends `sizes` but omits both `sizeStocks` and `stock`. The code comments this as deliberate: "so autosave can persist durum without wiping stock".
  - **Result:** the server keeps the old non-zero `size_stocks`, so an owner apparently can't mark a sized garment sold out through its stock fields.
  - **Parity decision:** the rebuild must make an explicit call here (see Still open, Q4), not copy it silently.
- Owner-facing strings in this flow are named after one boutique: `LILA_DEFAULT_PHOTOGRAPHY_STYLE` and `TrLilaPhotographyStyle` are imported by the fashion editor, the wizard and `TrOwnerAiCatalogEnhance`. See C.4.

**Which pieces are already generic and which are fashion** (fashion imports counted with a grep):

| Piece | Lines | Fashion imports | Area A treatment |
|---|---|---|---|
| `TrOwnerManualPhotoGallery` | 189 | 0 | Reuse as-is (already shared with Basit) |
| `TrOwnerSizeChartStock` | 370 | 0 (but garment size charts via `productOptions`) | Reuse as the fashion **Beden & stok** card; move under `fashion/panel/` when convenient |
| `TrOwnerColorGroupLinker` | 255 | 0 | Reuse as a fashion card (it's an *action* with its own endpoint) |
| `TrOwnerAiFillListing` | 151 | 0 | Reuse; its output lands as unsaved form edits (the §4 rule for AI text) |
| `TrOwnerGuidedPhotoUpload` | 2,252 | 9 | Reuse unchanged inside the fashion Medya card; it's the core fashion piece. Relocating it is its own later job |
| `TrOwnerAiCatalogEnhance` | 1,005 | 3 | Reuse unchanged; paid media is stored when generated, as today |
| `TrOwnerProductFeaturesFields` | 240 | 2 | Reuse as the fashion "Özellikler" block |
| `TrOwnerCategoryPicker` | 118 | 1 | Reuse; the fashion code tree stays (`category_mode = legacy`) |
| Delete card, price fields, title field | — | 0 | **Extract** from Basit into shared components (`TrPanelProductDeleteCard`, `TrPanelPriceFields`, `TrPanelTitleField`) and use in both editors |

### A.2 Milestones

| # | Milestone | Contents | Touches live data? | SQL |
|---|---|---|---|---|
| **A0** | Pure fashion form rules | `src/lib/tr/fashion/productForm.ts`:<br>• `FashionProductFormState`<br>• `fashionFormFromProduct`<br>• `validateFashionProductForm`<br>• `fashionProductPatch`, sending only editor-owned fields, like `simpleProductPatch`<br>• shared price rules reused from `simpleProductForm` where the meaning is identical<br>**Tests pin the patch against fixtures** shaped like the five real lilabutik size lists, a takım product, a colour-grouped product, a manual-listing product and a no-sizes product. Nothing imports it yet | No | – |
| **A1** | Shared generic blocks | Extract the delete card, title field and price fields from `TrSimpleProductEditor` into shared components. Basit/Gelişmiş switch to them with **no visible change** (regression-check the Basit editor on `deneme-butik`). Rename `slugifyCustomId` callers onto `seo/slug.ts`'s `slugify` only if the output is identical for existing category ids (tested); otherwise leave it | No | – |
| **A2** | `TrFashionProductEditor` (parity) | New editor in `fashion/panel/`, built on the shared blocks, `TrPanelEditorSave` + `useUnsavedChangesGuard`, and toasts instead of `panelErrorClass`. Same cards and tabs as today:<br>• Temel bilgi<br>• Medya, with the guided/manual/takım modes<br>• Ürün detayı: Açıklama as a plain textarea, Özellikler, Kategori<br>• Envanter: beden & stok, renkler, colour group<br>• Sil<br>AI actions (restyle, enhance, colour-group link) keep saving immediately, and **rebase only the fields they own** into the form's baseline, so they neither clobber nor get clobbered by unsaved edits. Reachable only via a staff query flag on `urun/[id]` | Writes lilabutik rows only when staff use the flag | – |
| **A3** | Switch and retire | Parity check (§A.4) on `deneme-butik`, then staff use on a handful of real lilabutik products. Make the new editor the default for `fashion`, keeping the old one behind the flag for one release, then delete `TrProductEditorForm`. Update docs 05/06 (remove the "Known exceptions" line and the autosave note in the foundation plan §4). Once the dispatcher has no direct fashion import, add `TrOwnerEditProductPage` to `FASHION_FREE_CORE_TARGETS` | **Yes: the default editor for every live product** | – |
| **A4** (optional, needs a yes per card) | Foundation cards for fashion | Opt in individually:<br>• **Alış fiyatı** and **Tedarikçi/HS**: owner-only, zero storefront effect.<br>• **Envanter** (SKU/Barkod/desi): stored only.<br>• **Ürün detayı** (Marka/Etiket/Google kategorisi): stored only.<br>• **SEO card**: *see Still open, Q3*. Setting a slug on a lilabutik product moves its canonical URL. | Only the SEO card has a live, shopper-visible consequence | none (columns exist) |
| **A5** | Wizard pass (small) | Wizard error boxes → toasts; its create payload built by `fashion/productForm.ts` so wizard and editor can't drift. **No** structural change | Creates new lilabutik products, as today | – |

### A.3 Keeping the boundary

- **Fashion code stays in fashion folders:**
  - All new fashion code goes in `src/components/tr/fashion/panel/` and `src/lib/tr/fashion/`.
  - Only the generic blocks extracted in A1 live in `components/tr/panel/`, and they import nothing from `fashion/`.
- **The dispatcher gets a registry slot.** Today `TrOwnerEditProductPage` imports `TrProductEditorForm` directly (a core → mixed-component edge).
  - Target: an editor slot on the product-type registry. `productTypes/registry.ts` already knows `fashion` by id; a small `productEditors` map that `fashion/panel` registers into, or a `next/dynamic` import keyed by type in one allow-listed file.
  - The dispatcher then imports no fashion internals and can join `FASHION_FREE_CORE_TARGETS`, which is how 06 says the list is meant to grow.
- **Never add a directory to that list before it's clean.**

### A.4 lilabutik parity check (A3 gate)

Run against `deneme-butik` first, then with staff on real lilabutik products. **Every item is a pass/fail against what the old editor writes for the same edit:**

1. Open → Kaydet with no changes sends nothing (`requireDirty`); the row's `updated_at` is unchanged.
2. **Price:**
   - Normal only: same `price_kurus`, `compare_at_price_kurus = null`.
   - Discounted: the same pair as the old "İndirim var mı?" toggle.
3. Each of the five real size lists: sizes, `size_stocks` and `stock` are written identically, including custom sizes (`allowCustomSizes`).
4. Takım product: images are read-only, the category is locked and `features.uploadKind`/`setItems` survive.
5. Colour-grouped product: link and unlink work, and `features.colorGroupId` isn't overwritten by a later Kaydet.
6. AI restyle / enhance mid-edit: the generated images persist, unsaved title edits survive, and Kaydet afterwards doesn't revert the images.
7. Manual-listing toggle: `features.manualListing` round-trips.
8. Durum Satıldı/Gizli round-trip; the storefront's sold/hidden state matches.
9. Delete of a product with orders hides it and shows the warning toast.
10. **Storefront spot check:**
    - PDP, PLP card and cart add for three edited products on `lilaboutiquedenizli.com` look identical before and after.
    - Nothing outside the panel changed.

### A.5 Risks

| Risk | Level | Mitigation |
|---|---|---|
| New editor writes a live lilabutik product differently (price, stock, features) | **High impact, low likelihood** | A0's pinned payload tests, A2's field-scoped patch, the A.4 checklist, staff-flag period, one-release rollback |
| Owner loses edits because autosave is gone | Medium | Leave guard, Ctrl+S, "Kaydedilmedi" status. Tell lilabutik's owner before A3 flips (Still open, Q2) |
| AI flow and unsaved form race | Medium | AI actions rebase only their own fields (images, lifestyle images, features keys they own). Covered by A.4 item 6 |
| Boundary regression | Low | New code under `fashion/`; lint enforces the dispatcher once it's added to the list |

**Storefront / checkout:** none touched. Area A needs **no** freeze lift.

## Area B — Fashion sizes and colours onto the variant model

### B.1 Verifying the "~25 files" estimate

The plan doc's "About 25 storefront/checkout files touch `size` today" is **an undercount**.

**Method:** a symbol grep (`sizeStocks`, `size_stocks`, `.sizes`, `item/line.size`, `size:` fields, `SizePicker`, `SizeGate`, `sizeChart`). I then dropped false positives (UI `size="sm"` props on `TrEditorialSaleBadge`, `TrFavoriteButton`, `TrCartLink`) and two one-line re-export shims.

**Shopper-facing storefront and cart (19 files):**
- Commerce scope and cart: `TrBoutiqueCommerceScope`, `TrBoutiqueCartPageContent`, `TrBoutiqueEditorialCommercePanels`.
- Order screens: `TrBoutiqueCancelOrderModal`, `TrBoutiqueDemoOrderDetail`.
- Custom-art PDP: `TrCustomArtProductPanel` (custom_art's "boyut").
- Checkout and add-to-cart: `TrCheckoutPageContent`, `TrPurchaseActions`, `TrQuickAddToCartButton`, `TrSizeGateSheet`.
- Fashion size chart: `fashion/pdp/TrBoutiqueSizeChartModal`, `TrBoutiqueSizeChartBodyGuide`.
- PDP: `TrProductDetailPanel` (35 hits), `TrProductPurchasePanel`, `TrProductSizePicker`.
- Cart state: `useTrBoutiqueCartRevalidate`, `trAddedToCartStore`, `trBoutiqueLocalCartStore`, `types/tr-cart.ts`.

**Server: checkout, orders, inventory, feed, catalog (16 files):**
- Checkout: `api/tr/checkout/route.ts`, `checkoutSelection`, `checkoutValidate`.
- Inventory: `inventory`, `inventoryLines`.
- Orders, invoices and messaging: `invoices`, `orders`, `whatsapp`, `demoShopperOrders`, `orderItemOption`, `invoiceFields`.
- Feed: `googleMerchant/feed`.
- Catalog: `catalog/products`, `catalog/mappers`, `catalog/productOptions`, `sizeStocks`.

That's **~35 on the storefront/checkout/order/feed side**, plus `types/tr-marketplace.ts`.

**Owner side adds ~12 more** (`TrOwnerStockPage`, `TrOwnerSizeChartStock`, the fashion editor, the wizard, batch and takım flows and their drafts, `orders/sellableUnits`, `priceManualLine`, manual order), **about 50 in total**.

It's a heuristic grep, so treat it as ±5, but the order of magnitude is **~35 shopper-path files, not ~25**.

**Colour groups have a separate footprint.** `colorGroupId` / colour siblings are read on the PDP (`urun/[productId]/page.tsx`, `TrBoutiqueProductPage`, `TrBoutiquePdpSplit`, `TrBoutiquePdpRelated`, `TrProductColorSiblings`, `TrProductDetailPanel`), in `publicData.ts`, and in the panel/AI colour-variant pipeline.

### B.2 What unifying would actually take

**Beden → variant type (mechanically possible, expensive):**

1. **Prerequisite: M7c-2 and M7c-3 must exist first** (product-page selectors, cart keyed by variant, public read policy, feed item per variant, Stok rows per variant). Today no shopper can buy *any* variant product, so fashion can't be moved onto a model the shop can't sell.
2. **Fashion-specific storefront pieces must learn variants.** The PDP size picker, the size-gate sheet on quick-add, the size-chart modal (keyed by size label → cm table) and the "Beden:" order copy.
3. **Additive SQL.** For each of the 93 sized products:
   - Create a **Beden** option from the boutique's type. The M7a İçe aktar already builds Beden from `size_presets`, but the five real charts differ, so one type needs the union of all values: roughly 7 letter sizes + 15 numeric.
   - Create one variant per size carrying that size's `size_stocks` count. That's ~5–15 variants per product, **roughly 900 rows**, under the 100-per-product cap.
   - Tests must prove this is idempotent and reversible.
4. **A cutover for live inventory.**
   - Either dual-write `size_stocks` ⇄ variant stock through a transition window,
   - or a hard cutover, where checkout for `fashion` switches from the per-size map to variant rows in one deploy while carts hold `(productId, size)` lines in shoppers' localStorage.
   - Either way, open carts, pending iyzico holds and the cancel/restock path must be handled for both line shapes at once.
5. **The panel:** Stok page, fashion editor Beden card, wizard, batch and takım flows, manual order units.

**Renk → variant type: not worth it for lilabutik, possibly ever.**
- lilabutik's colours are **separate products** (28 products in 12 groups). Each has its own packshots, AI try-on lifestyle images, title, and indexed URL.
- Folding a group into one product with a Renk option would **merge URLs** (redirects for 16+ products), **change the Google feed** (item ids, `item_group_id`), and lose per-colour titles and packshot sets.
- Only 2 products use the on-product `colors` array at all.
- **Recommendation:** colour grouping stays a fashion concept permanently. Variants' Renk is for *new* stores that sell one product in several colours with shared photos.

### B.3 Recommendation

**Defer Area B. Don't start it now.** Revisit when all of these are true:

1. M7c-2 and M7c-3 have shipped (they need their own freeze lift) and **at least one real Gelişmiş product has sold through the shop** (today: 0 variant order items ever).
2. Area A has shipped. The fashion editor is then built from cards, so swapping "Beden & stok" for a variant card is one card, not a 1,500-line rewrite.
3. There's a concrete reason: a second fashion store that needs per-size SKU/barcode/price, or the Stok page / reporting maintenance cost of two stock models becoming real.

What lilabutik gets from B is **nothing shopper-visible**. The cost is the broadest freeze lift yet, touching live checkout and inventory for all 93 sized products. §8.5's call stands.

**Worth doing meanwhile (cheap and reversible, each needs a yes; none is required):**

| # | Step | Risk |
|---|---|---|
| B0 | Correct the "~25 files" line in the foundation plan §8.4 to "~35 shopper-path, ~50 total" | None (doc) |
| B1 | Decide whether **new** fashion boutiques should create garments as Gelişmiş with a Beden type once M7c-2 ships, leaving lilabutik on the legacy model indefinitely. This is the lower-risk way to "unify": stop growing the legacy model rather than migrating it | None until M7c-2 |
| B2 | Put a size-model seam in the pure layer: one `productSellableUnits(product)` read used by checkout validation, inventory, the Stok page and `sellableUnits.ts`, covering size map / variants / plain stock. Today `orders/sellableUnits.ts` already does this for manual orders. It's pure and tested, but the checkout/inventory call-site switch is frozen code, so **only the pure half** without the freeze | Low (pure half) |

## Area C — Remaining per-slug code touches

Doc 03's table lists four. Verification found **two more** that a self-onboarded store also can't get without code.

| # | Concern | Where | Consumers | What a new store gets today | Recommendation |
|---|---|---|---|---|---|
| C.1 | Editorial skin `classic`/`atelier` | `boutiqueHome/editorialSkin.ts` (`SLUG_SKINS`, sync) | 13 storefront files (shell, header, footer, home, PLP, product card, PDP split, you-may-also-like, editorial content) | `classic` | **DB column when a second real store onboards**, not before |
| C.2 | Branded auth-email logo | `authMail/templates.ts` (`EMAIL_LOGO_PATHS`) | `sendBoutiqueAuthEmail` | **Not "no logo"**: it already falls back to the DB `logo_url` via `resolveBoutiqueLogoUrl`, *unless that is an SVG* (skipped for email clients) | **Delete the map now**; see below |
| C.3 | AI try-on house model | `aiModel/registry.ts` (`BOUTIQUE_AI_MODELS`, `LILA_*`) | 9 files, incl. the fashion editor, wizard, batch draft, `TrOwnerAiCatalogEnhance`, `TrOwnerAiModelPicker`, generate/prompts | The shared studio models (Ayla, Selin, Deniz) | **Keep as manual ops work**; only de-Lila the generic code |
| C.4 | Live carrier (Basit Kargo) | `shipping/registry.ts` (`SHIPPING_BY_SLUG`, sync) + token from the env var `TR_SHIPPING_BASITKARGO_TOKENS` (JSON slug→token) | 13 files, incl. **`api/tr/checkout/route.ts`** (stamps `shippingProvider`), **`catalog/pdpReturns.ts`** (PDP copy), webhook, owner shipment, tracking page, go-live check, manual order, order pages | Manual shipping (Kargoya ver drawer) | **Move to `tr_boutique_integrations`** (roadmap P4-T2) when a second store wants labels |
| C.5 (**not in doc 03**) | Favicon on a custom domain / subdomain | `seo/hostFavicon.ts` → `resolveBoutiqueFaviconFilePath` (code map only, **no DB fallback**) | Host favicon | **The Cortisstyle favicon** on its own domain | Fix with C.1 (same storefront pass) |
| C.6 (**not in doc 03**) | Brand overrides | `storefront/boutiqueBrand.ts`: 7 lilabutik maps (accent, logo, logo-on-dark, favicon, intro label, document title, meta description) | Most have DB fallbacks, but `IntroLoader` (custom-domain intro mask) and `resolveBoutiqueThemeAccentBySlug` (password-reset page) read **only** the code maps | No intro-mask brand; platform accent on reset-password | Leave the lilabutik overrides. Fold the two no-DB paths into C.1/C.5's pass |

### C.1 Editorial skin

- **Plan:**
  - `supabase/patch_tr_boutiques_editorial_skin.sql`: `add column if not exists editorial_skin text null` with a check on `('classic','atelier')`, and add it to `tr_boutiques_public`. The resolver becomes `boutique.editorialSkin ?? SLUG_SKINS[slug] ?? 'classic'`.
  - Keep `lilabutik: 'atelier'` in the map as a permanent fallback, so lilabutik renders identically even before the SQL is applied, or if the column is null.
  - Add it to the intake (`create-boutique.mts`) and Ayarlar.
- **Risk:**
  - The resolver is **synchronous and slug-keyed** in 13 storefront files. Switching it to read the boutique row means threading the value through the editorial shell's props/context.
  - That's a storefront change, so **it needs a scoped freeze lift**.
  - For lilabutik the output is provably unchanged (map fallback). The risk is purely a mis-threaded prop showing `classic` somewhere on `lilaboutiquedenizli.com`.
  - **Parity:** screenshot home, PLP, PDP, cart and footer before and after.
- **Why not now:** a new store getting `classic` is fine until a real second store wants `atelier`.

### C.2 Email logo

- `EMAIL_LOGO_PATHS.lilabutik` (`/tr/boutiques/lilabutik/logo.png`) duplicates what `resolveBoutiqueLogoUrl` already returns for lilabutik via `LOGO_OVERRIDES` (`…/logo.png?v=4`, a PNG).
- **Plan:** delete the map. lilabutik's email logo becomes the same PNG with a `?v=4` cache-buster.
- **The genuine gap is SVG-only logos.** Options, Mert's call (Q9):
  - (a) Leave it as ops: ask the store for a PNG at onboarding. The intake already asks for a logo.
  - (b) Add `tr_boutiques.email_logo_url`.
- I recommend **(a)**. No logo upload widget exists yet either, so adding a column only helps once one does.
- **Risk: low.** `authMail/` is already in `FASHION_FREE_CORE_TARGETS`, it isn't storefront/checkout, and the change is one fallback path. Verify by sending a signup/reset email for `deneme-butik` and `lilabutik` from a preview deploy.

### C.3 AI try-on house model

**Keep lilabutik's persona in code.** The persona is a set of reference photographs from a manual in-shop portrait shoot plus a per-boutique photography style (blinds/flash). A second store needs a shoot anyway; registering it is a small, deliberate ops change, the same class of work as the shoot. A `tr_boutique_ai_models` table only pays off once shoots are self-serve.

**What should change** (panel-only, rides with Area A, no data change):
- Generic panel code shouldn't carry lilabutik names. Rename `LILA_DEFAULT_PHOTOGRAPHY_STYLE` / `TrLilaPhotographyStyle` / `LILA_TRYON_SHOTS_PER_STYLE` to house-model terms, and let the style set come from the persona entry, not constants.
- **Must not change:**
  - the persisted id `boutique:lilabutik` (on 4 product rows);
  - the reference image paths;
  - `productCreateDraft`'s stored `photographyStyle` values (`"blinds"`/`"flash"`, in owners' localStorage).
- Optionally move `aiModel/registry.ts`'s persona map under `fashion/`, since try-on is garment-only (06's known-debt list already names `aiModel/elbiseTryOn.ts`).

### C.4 Carrier integration (the one that matters)

**The path is already paved:**
- `tr_boutique_integrations` exists, its column comment already names provider `basit_kargo`, and credentials are AES-256-GCM encrypted by `credentialEncryption.ts`.
- iyzico made exactly this move on 2026-09-23: dual-read, migrate lilabutik's row by script, verify on live checkout, remove the legacy path.

**Milestones:**

| # | Step | Live risk |
|---|---|---|
| C4a | Pure + DB read layer: `getCarrierIntegration(boutiqueId)` → `{ provider, token, autoBuyCapKurus }` from `tr_boutique_integrations` (`provider = 'basit_kargo'`, encrypted token, `metadata.autoBuyCapKurus` replacing the Lila-only `AUTO_BUY_FEE_CAP_KURUS`). It **falls back to today's `SHIPPING_BY_SLUG` + env token** when no row exists. Unit tests. Nothing calls it yet | None |
| C4b | Switch the **non-storefront** consumers: owner shipment route and order routes, webhook, go-live check, manual order, panel order pages. They are all server- or panel-side and can go async | Low–medium: **lilabutik's label purchase and webhook**. Verify one real label buy and cancel, plus a webhook delivery, on lilabutik after deploy |
| C4c | Script `scripts/migrate-carrier-credentials.mts --slug lilabutik` (generalized, unlike the iyzico one) inserts lilabutik's row from the env token. **Mert runs it.** Verify reads now come from the DB | Medium; same verification as C4b |
| C4d | **Frozen consumers:** `api/tr/checkout/route.ts` (sets `shippingProvider` on the order) and `catalog/pdpReturns.ts` (PDP delivery copy). Both call the sync slug check today; switching to the async DB read changes live checkout and PDP code. **Needs a scoped freeze lift.** Regression: a lilabutik test order still gets `shipping_provider = 'basitkargo'`, and the PDP returns copy is unchanged | **High stakes (live checkout)**, small diff |
| C4e | Remove the slug map and env fallback; update docs 03/05 and the go-live check. Owner-facing "connect your Basit Kargo" UI stays out (Phase 3) | Low once C4c/C4d are verified |

Until C4d ships, a *second* store with a DB row would get labels in the panel but orders without `shippingProvider` stamped at checkout. So C4b–C4d should land together, or C4d first. Don't give a second store a row before C4d.

### C.5 / C.6 Favicon and no-DB brand paths

Fold into C.1's storefront pass:
- `hostFavicon.ts` should fall back to the DB `logo_url` (or a new `favicon_url`), not the platform favicon.
- `IntroLoader`/reset-password accent should read the boutique row the page already has, or keep the map for lilabutik and use `theme_accent` elsewhere.

The lilabutik maps remain as overrides, so lilabutik is unchanged.

## 2. Recommended order, and why

| Order | Item | Why this position |
|---|---|---|
| 1 | **B0 + doc fixes** (doc 03 "one boutique", 05's wizard "autosave" wording, §8.4 file count) | Free. Makes the docs true before anyone builds on them |
| 2 | **C.2** email logo map removal | Trivial, low risk, removes a per-slug touch outright |
| 3 | **A0 → A1 → A2 → A3** (+ the C.3 de-Lila rename inside A2) | Biggest real gain: every lilabutik edit moves to the panel's save model and shared blocks. Needs **no** freeze lift. A prerequisite for any future Area B, because the editor becomes cards. Highest-stakes panel change, so it goes before anything else that also touches lilabutik data |
| 4 | **A4** cards (per yes) and **A5** wizard pass | Only after A3 has been the default for a while without incident |
| 5 | **C4a–C4e** carrier → DB | Real value only when a second store wants labels. C4a/C4b are safe to do earlier; C4d needs a freeze lift on checkout, so batch it with the next approved checkout exception rather than lifting the freeze just for this |
| 6 | **C.1 + C.5 + C.6** skin/favicon/brand → DB | Trigger: onboarding a second real store. One scoped storefront freeze lift covering all three |
| 7 | **Area B** | Deferred behind M7c-2/M7c-3, Area A, and a concrete need (§B.3) |

## 3. Risk summary

| Item | Touches lilabutik storefront? | Touches checkout? | Touches lilabutik product data? | SQL |
|---|---|---|---|---|
| A0–A2 | No | No | Only via staff flag | – |
| **A3** | No (verified by spot check) | No | **Yes: default editor for all 94** | – |
| A4 SEO card | **Yes, if a slug is set** (canonical URL) | No | Yes | – |
| C.1 / C.5 / C.6 | **Yes (visual shell)** | No | No | `editorial_skin` (+ maybe `favicon_url`) |
| C.2 | No (auth emails) | No | No | – |
| C.3 rename | No | No | No (ids unchanged) | – |
| **C4b/C4c** | No | No, but **live label purchase** | No | – (row via script) |
| **C4d** | PDP copy | **Yes** | No | – |
| **Area B** | **Yes, broadly** | **Yes** | **Yes: all 93 sized products** | several |

Every SQL patch above follows the existing convention: an idempotent `supabase/patch_*.sql` with the comment header (purpose, milestone, what reads it, safe-before/after-app note, RLS stance, "Manual apply only (Supabase SQL editor). Not applied by the agent."). Mert applies each one by hand.

## 4. Still open (Mert's decisions)

1. **Go / no-go on Area A**, and whether A3 (new editor as default for lilabutik) needs its own explicit go-ahead after the staff-flag period. I recommend yes.
2. **Autosave → manual save for lilabutik's owner:** fine to switch? Do you want to tell the owner first, or should the editor show a one-time "Artık Kaydet'e basmanız gerekiyor" hint?
3. **SEO card on fashion products (A4):** allow setting a slug on a lilabutik garment? It changes that product's canonical URL (the id URL keeps serving). Options:
   - (a) no SEO card for fashion;
   - (b) card with Sayfa başlığı/Açıklama/noindex only, slug hidden;
   - (c) full card.
   I recommend (b).
4. **All-sizes-zero stock (§A.1 latent bug):** should the new editor make "every size 0" save as sold out (my recommendation, verify the bug first), or keep today's behaviour exactly?
5. **Durum model for fashion:** keep the explicit Satıldı choice (D3, my default) or derive sold from stock like Basit?
6. **Which A4 cards, if any:** Alış fiyatı, Tedarikçi/HS, Envanter (SKU/Barkod/desi), Ürün detayı (Marka/Etiket/Google kategorisi)?
7. **Area B:** confirm deferral, and whether B1 (new fashion stores start on Gelişmiş + Beden once M7c-2 ships, lilabutik stays legacy) is the direction.
8. **Colour groups:** confirm that lilabutik's per-colour products are *never* merged into a Renk variant.
9. **Email logo for SVG-only stores:** (a) ops asks for a PNG (my recommendation) or (b) an `email_logo_url` column?
10. **Editorial skin / favicon DB work (C.1/C.5):** do it now pre-emptively, or wait for a second real store (my recommendation)?
11. **Carrier (C4):** do C4a/C4b now while it's cheap, or all together when a second store needs labels? And which approved checkout change should C4d ride along with?
12. **AI persona (C.3):** OK to keep it as manual per-boutique ops work, with only the de-Lila rename done now?
