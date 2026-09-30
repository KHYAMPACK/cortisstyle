# Fashion Beden & Kategori → foundation — plan

_Prepared 2026-09-30 on branch `main-t0o1c2`. **S1 built (2026-09-30), K0–K2 not started.** Facts checked against the repo at `ff89987` (after PR #3) and against the live Supabase project with read-only `SELECT`s. Background: `docs/lilabutik-foundation-migration-plan.md` (this is a follow-up to its Area A; its Area B — moving sizes onto `tr_product_variants` — stays deferred and is **not** what this plan does)._

**Goal (Mert):** a fashion boutique's **sizes (Beden)** and **categories (Kategori)** come from the boutique's own foundation definitions (Tanımlamalar → Varyant Türleri / Kategoriler) instead of lists hardcoded in code, so a new store can define its own without a code change.

## Status

**S1 built on `main-t0o1c2` (2026-09-30)** — needs `supabase/patch_variant_type_roles.sql` applied by Mert for the Kullanım (Beden/Renk) choice to save; everything else works without it.

- **Variant types:** `role` (`size` / `color`) with a "Kullanım" choice in the drawer, and a Beden/Renk tag in the list. **"Hazır bedenleri içe aktar"** creates Beden (XS–3XL) and Pantolon bedeni (24–52) for a boutique with no size type yet.
- **Size tables** (fashion editor, create wizard, batch and takım uploads) offer the boutique's size types (`sizeSources.ts`, `useOwnerSizeSources`), falling back to the built-in lists. Sizes are saved in the type's order. Drafts saved on `letter` / `numeric` are moved onto the matching type.
- **Stok page** now keeps a garment's own sizes (it used to add the whole chart, e.g. 2XL/3XL on an XS–XL dress, whenever one size's stock changed) and no longer has the 42–52 button (sizes are added in the editor).
- **Removed as dead code:** the old preset import and the unused `boutiques/[id]/options` API; `TrProductEditorForm`; `sizesForChart`, `sizesForStockBoard`, `missingNumericExpandedSizes`; the draft files' copies of the empty-board helper; the Stok page's never-read `savingIds`; the size table's deprecated `variant` prop.
- **Not built yet from S1:** decision 6, the "update products too" offer when a size is renamed — next.

## Decisions (Mert, 2026-09-30)

| Q | Decision |
|---|---|
| 1 | Beden first (S1), then Kategori (K0 → K1 → K2) |
| 2 | **Two size types** to start: "Beden" (XS…3XL) and "Pantolon bedeni" (24…52) |
| 3 | K0 freeze lift approved (sitemap + `/kategori/<slug>` check `category_mode`) |
| 4 | K2 freeze lift approved, planned right after K1 |
| 5 | Hidden style variants (kaşe mont, kot pantolon…) and legacy "Dış giyim" are left out of the import |
| 6 | Renaming a size value that products use **offers to update those products** too |

## 0. What's hardcoded today (verified)

### Beden

| Where | What is hardcoded | Reads it |
|---|---|---|
| `lib/tr/catalog/productOptions.ts` | The two size lists: letter `XS…3XL`, numeric `24…40` (+ `42…52` "expand"), the letter sort order, `detectSizeChart` (guesses letter/numeric from a product's labels) | Panel size board (`TrOwnerSizeChartStock`) in the editor, wizard, batch and takım flows; Stok page; `sortProductSizes` in the product PATCH route, Stok page and one storefront file (`TrBoutiqueAtelierPlp`) |
| `lib/tr/fashion/sizeCharts.ts` | The cm size guide (bust/waist/hip per size) for letter and numeric | Storefront PDP size-guide modal, via `detectSizeChart(product.sizes)` |

**What is *not* hardcoded:** each product stores its own labels (`tr_products.sizes`, `size_stocks`), and the storefront size picker renders those. So the storefront doesn't need the size lists — only the panel does (plus the sort order and the size guide).

**Live:** lilabutik's `size_presets` is empty and it has no variant types; its 93 sized products use five label sets, all drawn from the two built-in lists. `deneme-butik` has one variant type, "Beden", with 4 values.

### Kategori

| Where | What is hardcoded | Reads it |
|---|---|---|
| `lib/tr/fashion/categories.ts` | The 32-entry garment tree (roots elbise / üst giyim / alt giyim / aksesuar / ev + legacy dış giyim; shop leaves; hidden style variants like `kase-kaban`) | **28 files**: 9 storefront (menu, mega-menu, drawer, PLP, product grid, header, shell, marquee), 3 product components (card, PDP panel, quick sheet), 4 catalog libs (home rows, recommendations, featured, editorial content), 5 panel files, 4 fashion libs |
| Fashion logic keyed on category **ids** | ~130 references: `elbise` → dress construction pipeline and photo rules, `ust-giyim`/`alt-giyim` leaf checks, `takim` → two-piece flow, care-instruction copy, AI listing draft picks a category id from this tree (`parseAiCategoryId`) | Fashion editor, wizard, AI catalog, PDP care copy |

**Foundation already built (M3a):** `tr_categories` / `tr_product_categories`, the Kategoriler pages, `TrPanelCategoryPicker`, `/kategori/<slug>` pages, and `tr_products.category` kept equal to the primary category's slug. A boutique opts in with `category_mode = 'custom'`. **M3b** (storefront menu / PLP / tiles reading `tr_categories`) was never built — paused by the storefront freeze.

**Live:** lilabutik is `legacy`, 0 own categories. Products per category: elbise 52, pantolon 15, bluz 11, ceket 6, gömlek 3, takım 3, etek 2, tişört 2 (8 leaves in use).

**Found while planning — a storefront trap:** `sitemap.ts` and the `/kategori/<slug>` route read `tr_categories` **without checking `category_mode`**. So merely *creating* lilabutik's categories would publish new `/kategori/…` pages (the M3a layout, not lilabutik's atelier PLP) and add them to `lilaboutiquedenizli.com`'s sitemap. Any plan must gate those on `category_mode = 'custom'` first (or create the rows with `noindex`).

## 1. Decisions I'm assuming (change any of these)

| # | Topic | Assumption | Why |
|---|---|---|---|
| D1 | Scope vs. Area B | Sizes come from the boutique's **Beden variant types** as *definitions only*. Products keep storing `sizes` / `size_stocks`; **no `tr_product_variants` rows, no checkout/inventory change** | Keeps Mert's "defer variants" decision; the storefront doesn't read the size lists, so this is almost entirely panel work |
| D2 | Letter vs numeric | A boutique can have **several size types** (e.g. "Beden" = XS…3XL, "Pantolon bedeni" = 24…52). The editor's "Harf / Numara / Beden yok" becomes "which size type / Beden yok" | Mirrors today's two charts exactly and lets a store add e.g. "Ayakkabı numarası" |
| D3 | Marking a type as a size | New nullable column `tr_variant_types.role` (`'size'` \| `'color'` \| null), additive SQL | The panel needs to know which types are sizes without guessing from the name. Core stores the tag; only fashion interprets it |
| D4 | Categories keep their slugs | lilabutik's categories are created **with the same slugs as today's code ids** (`elbise`, `bluz`, `pantolon`…), so `tr_products.category` doesn't change and every storefront link keeps working | Zero data change on products; the storefront keeps rendering identically until M3b |
| D5 | Fashion meaning of a category | New nullable column `tr_categories.system_key` (unique per boutique). The imported categories get the code id as their key (`elbise`, `ust-giyim`, `takim`…). Fashion logic resolves "is this a dress / üst giyim / takım?" from the **system key of the category or its ancestors**, not the slug | Lets the owner rename a category or change its slug without breaking the dress pipeline. Core never interprets `system_key` (boundary respected); a new category under "Elbise" (e.g. "Abiye") is automatically treated as a dress |
| D6 | How lilabutik gets its rows | An explicit **"Hazır kategorileri içe aktar" / "Hazır bedenleri içe aktar"** button (like M7a's Beden/Renk import), not an SQL seed | Same precedent as M7a: nothing appears in a live boutique's database unasked |
| D7 | Which categories are imported | The roots and shop leaves (23), **not** the hidden style variants (`kase-kaban`, `kot-pantolon`…) or legacy `dis-giyim`; empty ones (ev, nevresim…) are imported too so the tree matches, and the storefront keeps hiding empty categories as today | Those variants exist only to match old products; lilabutik has none |
| D8 | Size guide (cm) | Stays in code for now, still chosen by the labels (a letter-label type → letter guide, numeric → numeric guide) | It's garment measurement data, not a list of sizes; a per-boutique size guide is a separate feature |

## 2. Milestones

Each ships on its own. Order: **S1 → K0 → K1 → K2**, then K3/S2 only if wanted.

### Beden

| # | Milestone | Contents | Storefront? | SQL |
|---|---|---|---|---|
| **S1** | Sizes from the boutique's Beden types | • `role` column; Varyant Türleri drawer gets a "Bu bir beden türü" / "renk türü" choice.<br>• **"Hazır bedenleri içe aktar"** creates "Beden" (XS…3XL) and "Pantolon bedeni" (24…52) with `role = 'size'` for a boutique that has no size type yet.<br>• `TrOwnerSizeChartStock` takes the boutique's size types instead of the built-in charts: pick a type (or "Beden yok"), its values become the quick-add chips, order follows the type.<br>• A product's current type is found by matching its labels to a type (the successor of `detectSizeChart`); unmatched labels still show and save as today.<br>• Used by the fashion editor, wizard, batch and takım flows and the Stok page.<br>• **Fallback:** a boutique with no size type yet sees today's built-in charts, so nothing breaks before the import. | No (`product.sizes` unchanged) | `patch_variant_type_roles.sql` |
| S2 (optional, later) | Size order and guide from the type | Storefront sorts sizes by the type's value order instead of the hardcoded letter order; optional per-type cm size guide | **Yes** (freeze lift) | maybe |

### Kategori

| # | Milestone | Contents | Storefront? | SQL |
|---|---|---|---|---|
| **K0** | Close the sitemap/page trap | `sitemap.ts` and `/kategori/<slug>` only use `tr_categories` for boutiques in `custom` mode. Today that changes nothing (lilabutik has no rows; `deneme-butik` is `legacy`) | **Yes, tiny** (sitemap + one route; needs a scoped freeze lift) | – |
| **K1** | Import + panel switch | • `system_key` column.<br>• **"Hazır kategorileri içe aktar"** on the Kategoriler page (legacy boutiques only): creates the tree with today's slugs and keys, and assigns every product to its current category as primary (`tr_product_categories`). It does **not** change `tr_products.category`.<br>• Fashion logic (`garmentUploadTypes`, `takimUpload`, care copy, AI listing draft) resolves families via `system_key` with the old id match as fallback.<br>• Fashion editor shows `TrPanelCategoryPicker` in `custom` mode (the code-tree picker in `legacy`).<br>• AI listing draft chooses among the boutique's own categories.<br>• A category whose system key fashion needs (elbise, takım…) can be renamed but not deleted, with a clear message.<br>• **Switching lilabutik to `custom`** is the last step, done by Mert with one `update` after checking the import. | No, once K0 is in: with identical slugs, the storefront keeps reading the code tree and shows the same menu | `patch_category_system_keys.sql` |
| **K2** | Storefront reads the boutique's categories (= M3b) | Menu, mega-menu, drawer, PLP filters/labels, product-card/PDP labels and breadcrumbs, home rows, recommendations read `tr_categories` for `custom` boutiques; `legacy` keeps the code tree. Parity check: lilabutik's menu and PLPs identical before/after. After this, a category the owner creates actually appears in the shop | **Yes, broad** (~15 storefront files, needs a freeze lift) | – |
| K3 (later) | Retire the code tree | `fashion/categories.ts` becomes only the import template + AI fallback | – | – |

## 3. Risks

| Risk | Level | Mitigation |
|---|---|---|
| Category rows publish new pages / sitemap entries on lilabutik | **High** if skipped | K0 first; import button only offered after K0 is deployed |
| Dress/takım pipeline misclassifies a product after the switch | Medium | `system_key` + ancestor walk, old id match as fallback; tests pinning every lilabutik category; keyed categories can't be deleted |
| Owner creates a category in `custom` mode before K2 and it doesn't show in the shop | Medium (confusing) | Panel hint "Mağaza menüsünde K2 ile görünecek" until K2 ships, or do K1 and K2 back to back |
| Size type edits (rename "M" → "Medium") don't rename existing products' labels | Medium | Say so in the drawer; renaming values in use either blocked or offered as "update N products" (decide in S1) |
| Stok page and old flows still assume the two built-in charts | Low | S1 routes all of them through the same size-type source, with the built-in charts as fallback |

## 4. Still open (Mert's decisions)

1. **Order:** Beden first (S1, panel-only, no freeze lift) and Kategori after? I recommend yes.
2. **Two size types** ("Beden" XS…3XL and "Pantolon bedeni" 24…52) as lilabutik's starting point — or one "Beden" type with everything?
3. **K0 freeze lift** (sitemap + category route check `category_mode`): OK? It's tiny and changes nothing today, but it touches storefront files.
4. **K2 freeze lift** (storefront menu/PLP read the boutique's categories): OK to plan it as the step right after K1, so owner-created categories actually appear in the shop?
5. **Hidden style variants** (kaşe mont, kot pantolon…) and legacy "Dış giyim": leave them out of the import (my default)?
6. **Renaming a size value used by products** (e.g. "2XL" → "XXL"): block it, or offer to update those products too?
