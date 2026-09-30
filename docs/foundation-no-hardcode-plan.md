# No hardcoded store data: target architecture and plan

_Prepared 2026-09-30 on branch `main-t0o1c2`. **Planning only; nothing here is built.** Mert asked for the architecturally cleanest approach: "no hardcoded stuff". This plan starts from where `docs/fashion-beden-kategori-plan.md` (S1, K1, K2 built) left off. Where it reverses an earlier decision, it says so and lists that as a question._

_Revised 2026-09-30 after two decisions from Mert:_

- **Colours become variants.** Colour-group products merge into one product with a Renk option. This reverses decision 8 of the lilabutik plan.
- **The model is designed as if there were no AI pipeline.** People fill in product info and add photos by hand. Nothing in the data model, the editor or the shop depends on AI. What happens to today's AI flows is §7, and it is not decided here.

## 0. The rule

> **Code says what the platform can do. The database says what a store has.**

The test for any piece of data: **could a new store set this up from the panel, without a deploy?** If not, it's hardcoded.

Without an AI pipeline, almost nothing product-related needs to be vertical code. What stays in code:

- **Generic behaviour.** The editor, the variant grid, checkout, stock, the feed, the storefront layouts. These are the same for every store and every vertical.
- **Starter templates.** For example: the fashion category tree, product kinds with their fields, the Beden / Pantolon bedeni / Renk types, default size-chart measurements. They live in code as seed data and are **copied once** into a store's own rows (at creation, or with an "İçe aktar" button). After that, nothing reads the template at runtime.

What must **not** be in code: anything keyed by a store's slug, and any list the storefront or panel reads at runtime to decide what a store sells, how it's grouped, what fields a product has, or how the shop looks.

The fashion "module" ends up as **a starter template plus, at most, a size-guide figure**. It no longer contains an editor, create flows or category rules.

## 1. Target model

Four building blocks, all store data, all generic (core):

| Block | What it answers | Tables |
|---|---|---|
| **Product kinds** | "What is this thing, and what do I fill in for it?" Elbise, Bluz, Pantolon, Takım… Each kind says which variant types a new product starts with and which Özellikler fields it has | new `tr_product_kinds` + `tr_attribute_definitions`; `tr_products.kind_id` |
| **Categories** | "Where does a shopper find it?" Menu, PLP filters, category pages | `tr_categories` + `tr_product_categories` (exist) |
| **Variants** | "Which one exactly, and how many are left?" Size × colour, SKU, stock, price, **photos per colour** | `tr_variant_types` (with `role`) + `tr_product_options` + `tr_product_variants` (exist); photos per option value (new) |
| **Store presentation** | Skin, brand, favicon, carrier | columns / rows on the boutique (`tr_boutiques`, `tr_boutique_integrations`) |

**Kind ≠ category.** Today fashion works out "this is a dress" from the category (`isUstGiyimCategory`, `garmentCategoryFor` via `system_key`…), which ties the shop's menu to how the editor behaves. With a kind on the product, the owner can file a dress under "Abiye", "Yeni sezon" and "İndirim" and nothing about its form changes. A kind is plain data, like Shopify's product types or Akeneo's families:

```
tr_product_kinds
  id, boutique_id, name ("Elbise"), sort_order
  default_option_type_ids uuid[]   -- e.g. [Beden, Renk]: the variant grid a new product starts with
  suggested_category_id            -- pre-selected in the category picker
tr_attribute_definitions
  id, boutique_id, key, label ("Kumaş"), input ('choice' | 'text' | 'multi'),
  options jsonb, sort_order
tr_product_kind_attributes (kind_id, attribute_id, required, sort_order)
```

- **Values stay in `tr_products.features` jsonb**, keyed by attribute key. Existing data (gender, fit, fabric, neckHem…) needs no migration; the template defines those keys.
- **Takım** is just a kind whose variant grid has two size types (Üst beden, Alt beden) or one, as the store decides. There is no special code.
- **The store edits kinds** in Tanımlamalar → Ürün türleri: rename, add fields, change which size type a kind starts with.

**Colour is a variant type** (`role = 'color'`). A product in three colours and five sizes has one page, one title, one description, and up to 15 variants.

- **Photos belong to the colour value**, not to each variant: new table `tr_product_option_media (product_id, option_value_id, images jsonb, sort_order)`. A product without colours keeps using `tr_products.images`.
- The product page shows colour swatches. Picking one swaps the gallery and updates the address (`?renk=kirmizi`), so shared links and ads open the right colour. The canonical URL is the product.
- The Google feed has one item per variant, with `item_group_id` = product and the `color` / `size` attributes. That is the structure Google asks for in apparel.

### How the pieces talk

```
 starter templates (code, seed data only, copied once)
   fashion: categories · kinds + fields · Beden / Pantolon bedeni / Renk · size charts
                    │  "İçe aktar" / new-store setup
                    ▼
 store data (DB): kinds · attribute definitions · categories · variant types (+ size charts)
                  · products (kind, features, categories) · variants · colour photos
                  · boutique presentation
                    │
     ┌──────────────┼───────────────────────────┐
     ▼              ▼                           ▼
 one product     storefront                commerce
 editor (panel)  (menu, PLP, PDP,          (checkout, stock, orders, feed)
                 size guide)
```

- The storefront, commerce and the editor **read data only**. No file outside the template imports `fashion/`.

## 2. Hardcoded today (inventory)

Verified on `main-t0o1c2`.

| # | Hardcoded thing | Where | Becomes | Milestone |
|---|---|---|---|---|
| H1 | Built-in category tree as a runtime fallback (`legacy` mode) | `fashion/categories.ts`, `fashion/legacyTaxonomy.ts`, `category_mode` checks | Store data only; the tree is a template | F1 |
| H2 | Panel category labels and legacy picker read the code tree | `TrOwnerProductListPage`, `orders/TrOrderProducts`, `dashboard/TrDashboardTopSellers`, `TrOwnerCategoryPicker` | The store's categories | F1 |
| H3 | Two category URLs (`/urunler?kategori=` and `/kategori/<slug>`) | storefront links, `sitemap.ts` | One canonical URL | F1 |
| H4 | Homepage campaign links to fixed slugs, lilabutik hero paths, "…Lila'da" copy | `boutiqueHome/editorialContent.ts` (`buildAtelier*`, `midCampaign`) | `tr_boutiques.editorial_content` (exists), links by category id | F1 |
| H5 | Garment meaning inferred from the category | `garmentUploadTypes.ts`, `garmentCategory.ts`, `tr_categories.system_key` | Product kinds (data) | F2 |
| H6 | Özellikler fields fixed in code | `features` keys, `dressFeatures.ts`, the fashion editor's cards | Attribute definitions per kind | F2 |
| H7 | A fashion-only editor and create flows | `TrFashionProductEditor`, `TrProductCreateWizard`, `TrOwnerBatchCreatePage` (+5 step files), `TrOwnerTakimCreatePage`, `TrOwnerFashionCreateChooser`, `fashion/productForm.ts`, `productPhotoChecks.ts`, `product_type = 'fashion'` | One generic editor (today's Basit/Gelişmiş editor grown up) | F3 |
| H8 | Two size charts and their cm tables | `fashion/sizeCharts.ts`, `catalog/productOptions.ts` (`DEFAULT_NUMERIC_SIZES`…) | Measurements on the store's size type | F4 |
| H9 | Sizes and per-size stock as columns on the product | `tr_products.sizes` / `size_stocks`, ~50 files (lilabutik plan §B.1) | Variants | F5, F6 |
| H10 | Colour as separate products linked through JSON | `features.colorGroupId`, `features.color`, `tr_products.colors`, colour-sibling code (PDP, related products, panel) | Renk variant type + colour photos | F5, F6 |
| H11 | Editorial skin by slug | `boutiqueHome/editorialSkin.ts` (`SLUG_SKINS`) | `tr_boutiques.editorial_skin` | F7 |
| H12 | Brand overrides by slug (7 maps), favicon | `storefront/boutiqueBrand.ts`, `seo/hostFavicon.ts` | Brand columns (mostly exist) + favicon column | F7 |
| H13 | Carrier by slug + token env JSON | `shipping/registry.ts` (`SHIPPING_BY_SLUG`), `TR_SHIPPING_BASITKARGO_TOKENS` | `tr_boutique_integrations` | F7 |
| H14 | Other slug checks | `proxy.ts`, `customDomain.ts`, `panel/panelLogo.ts`, `TrOwnerSettingsPage`, `admin/boutique-health`, `TrBoutiqueAtelierHomeSections` | Reviewed one by one | F7 |

The AI house-model registry (`aiModel/registry.ts`) is also slug-keyed, but it belongs to the AI pipeline, which this plan leaves out (§7).

## 3. Milestones

Each milestone ships on its own and leaves lilabutik working. The order follows the dependencies. Sizes are S / M / L, where L means a broad storefront + checkout change.

### F1: Categories are only data (M)

_Depends on: K2 merged and lilabutik switched to `custom` (steps in `fashion-beden-kategori-plan.md`)._

- The storefront, panel and sitemap read only `tr_categories`. Delete `legacyFashionTaxonomy`, the `legacy` branches and every runtime consumer of `fashion/categories.ts`. `categoryTemplate.ts` stays as the template.
- **New stores get the template at creation** (`scripts/create-boutique.mts`). `category_mode` stays in the DB (additive-only), but the code stops reading it.
- **One URL per category: `/kategori/<slug>`**, rendered by the store's own PLP (atelier or classic), with filters as query params. `/urunler?kategori=x` redirects there. Only that URL is in the sitemap. Slug renames already record redirects.
- **Editorial content references categories by id**, resolved to the current slug/label at render. lilabutik's atelier defaults (`buildAtelier*`) move into its `editorial_content` row: a one-time data patch generated from what the code renders today. The `buildAtelier*` code is then deleted.
- Panel labels (H2) read the store's categories.
- **SQL:** `patch_editorial_content_lilabutik.sql` (data). **Freeze:** yes (links, `/kategori` layout). **lilabutik:** category URLs change, with redirects.

### F2: Product kinds and fields are data (M)

- **Schema:** `tr_product_kinds`, `tr_attribute_definitions`, `tr_product_kind_attributes`, plus `tr_products.kind_id uuid null`.
- **Panel:** Tanımlamalar → **Ürün türleri** (list + drawer: name, starting variant types, suggested category, fields) and **Özellikler** (field definitions: label, input, options). Same patterns as the Kategoriler and Varyant Türleri pages.
- **Template:** the fashion kinds and fields come from what the fashion editor shows today. The kinds are the distinctions the current code actually makes (expected: Elbise, Bluz / Üst, Pantolon, Etek, Takım, Dış giyim, Aksesuar); the fields are today's `features` keys and `dressFeatures.ts` groups, with their option lists. "Hazır türleri içe aktar" creates them. **No extra fields are added** (lilabutik plan Q6).
- **Backfill:** one data patch sets `kind_id` for every existing product from its current category (generated from the tested mapping in `garmentCategory.ts`, so the SQL and the code can't disagree). Checked with read-only SELECTs: every product gets a kind, and the counts match the category counts.
- Nothing reads `kind_id` yet except the product list (a Tür column/filter). The editor switches in F3.
- **SQL:** `patch_product_kinds.sql` (schema), `patch_product_kinds_lilabutik.sql` (data). **Freeze:** no. **lilabutik:** no visible change.

### F3: One product editor (M–L)

_Depends on F2. The fashion editor (Area A) was the right step for lilabutik at the time; this replaces it with the generic one._

- The Basit/Gelişmiş editor (`TrSimpleProductEditor`) becomes **the** editor for every product, create and edit, every vertical. Its cards:
  - **Tür:** picks the kind. Changing it offers to add the kind's fields and variant types; it never deletes data.
  - **Temel bilgi:** title, description.
  - **Fotoğraflar:** product photos, or photos per colour once the product has a Renk option.
  - **Fiyat.**
  - **Varyantlar:** the variant grid, e.g. Beden × Renk, stock/SKU/price per variant. It starts from the kind's option types.
  - **Özellikler:** the kind's fields, rendered from the definitions.
  - **Kategoriler:** the picker, with the kind's suggested category pre-selected.
  - **SEO / Durum:** as today.
- **Photos:** a plain ordered list; the first is the cover. The fashion photo-slot rules (front / back / packshot, `productPhotoChecks.ts`) go away. At least one photo is needed to publish.
- **Create = the same editor, empty.** "Ürün ekle" opens it with the kind picker first. There is no wizard and no separate batch or takım flow. A quick bulk path can be added later as a generic "import from spreadsheet", not as a fashion flow.
- **Until F6, fashion products keep their size table.** Products still on `sizes` / `size_stocks` show the existing size-and-stock card (`TrOwnerSizeChartStock`) in place of the variant grid, so F3 can ship before the size cutover.
- **Deleted at the end of F3:** `TrFashionProductEditor`, `TrProductCreateWizard` + drafts, the batch pages (6 files), `TrOwnerTakimCreatePage`, `TrOwnerFashionCreateChooser`, `fashion/productForm.ts`, `productPhotoChecks.ts`, the editor registry slot, `garmentUploadTypes.ts`, `garmentCategory.ts`, `categoryPayloadForGarment`. `product_type` stops being read (column stays). **What happens to the AI features these files contain is §7's question**; F3 doesn't start until that is answered.
- **Freeze:** no (panel only). **lilabutik:** the owner's editor and create flow change. This is the biggest change the owner sees.

### F4: Size charts are data (S–M)

- The cm measurements move onto the size type. Each value of a size-role variant type gets measurement rows (point → cm) plus a measure kind (body / garment), stored as `size_chart jsonb` on `tr_variant_types`. The Beden drawer gets an "Ölçü tablosu" section.
- The size-guide modal reads the chart of the product's size type. The figure and measuring hints are the one piece of fashion code left in the storefront, shown only when the size type has a chart.
- A one-time data patch fills lilabutik's two types with today's `LETTER_SIZE_CHART` / `NUMERIC_SIZE_CHART` values. "Hazır bedenleri içe aktar" includes the defaults.
- **Deleted:** the chart tables and the chart detection from sizes.
- **SQL:** `patch_size_charts.sql` + data. **Freeze:** yes, small (size-guide modal). **lilabutik:** identical modal.

### F5: Variants can be sold in the shop, with colours (L)

_Formerly M7c-2 + M7c-3, now including colour._

- **Product page:**
  - swatches for a colour option, buttons for the others;
  - the gallery switches with the colour (`tr_product_option_media`);
  - `?renk=` in the URL, canonical = product;
  - out-of-stock combinations disabled.
- **Cart:** lines keyed by product + variant. Quick-add and the size gate choose a variant.
- **Public read:** of active variants, options and colour photos (view or RLS).
- **Feed:** one item per variant, `item_group_id` = product, `color` / `size` set, images from the colour.
- **Stok page:** rows per variant.
- **Server half (M7c-1) already built:** checkout, inventory, cancel/restock per variant.
- **Proof:** a Gelişmiş test product in two colours × three sizes is sold end to end before F6.
- **SQL:** `patch_product_option_media.sql` + public read policy. **Freeze:** yes, broad (PDP, cart, checkout client, feed). **lilabutik:** none (no variant products yet).

### F6: lilabutik's sizes and colours become variants (L, riskiest)

_Reverses the lilabutik plan's "defer Area B" (§B.3) and decision 8 (colour groups never merged). Mert approved the colour merge in principle on 2026-09-30; the go-ahead for this milestone itself is Q2._

**Checklist before the migration** (live data, checked read-only 2026-09-30: 28 products in 12 colour groups):

- [ ] **Colour labels.** 8 of the 28 have no `features.color`. They must be filled in, because each becomes a Renk value.
- [ ] **Descriptions.** They differ per colour in every group (written per product). Per group, pick one, or write a new one. After the merge there is one per product.
- [ ] **Titles.** Pick one per group, without the colour word ("Maxi Tek Omuz Elbise", not "Kırmızı Maxi…"). The colour is shown by the swatch.
- [ ] **Is it one garment?** The group "Gri taşlı Wide Pantolon / Antrasit Taş Detaylı Jean Pantolon / Mavi Taş İşlemeli Geniş Paça Jean" looks like three different trousers. It is probably better left as three products. Mert decides per doubtful group.
- [ ] **Size sets.** They differ inside 2 groups. Fine: only the size × colour combinations that exist are created.
- [ ] **Prices and categories.** Identical inside every group (checked), so there is nothing to reconcile.
- [ ] **Single-member groups (2).** They become ordinary products with one colour, or no Renk option.

**Migration:**

- A script builds a per-product plan from `sizes`, `size_stocks`, `features.color` and `colorGroupId`, plus the checklist answers (a small JSON file Mert fills in):
  - which product survives each group (the oldest, so its URL stays);
  - the Beden and Renk options;
  - one variant per existing size × colour, with that product's size stock;
  - colour photos from each merged product's images;
  - redirects from the merged products' URLs.
- **Dry run first:** it prints the plan per group and the checks:
  - total stock per group before = after;
  - every size_stocks entry lands on exactly one variant;
  - photo counts match.
- Merged products are **hidden, not deleted** (status + a `merged_into` pointer), so old order lines, favourites and shared links keep resolving. Their URLs 301 to the surviving product with `?renk=`.
- **Cutover** is one deploy at a quiet hour:
  - checkout, inventory, cart and PDP read variants for every product;
  - old carts in shoppers' browsers hold `(productId, size)` lines; on load these map to the matching variant, following `merged_into` and the line's colour;
  - a line that can't be mapped is dropped with the existing "no longer available" notice;
  - order lines from before keep the old `size` path, read-only (27 today);
  - pending iyzico holds made just before the cutover are also on the old path and are handled by it.
- **After:** `sizes`, `size_stocks`, `colors` and `colorGroupId` are no longer written or read; the columns stay (additive-only). All the shopper-side `size` code (lilabutik plan §B.1) and the colour-sibling code is deleted in the same change or the next.
- **SQL:** `patch_product_merged_into.sql` (column) + the generated data patch, run by Mert. **Freeze:** yes, the broadest (checkout, inventory, PDP, cart, orders, feed). **lilabutik:** fewer, richer product pages; 16 URLs redirect.

### F7: Store presentation leaves the slug maps (M, on hold)

This is the lilabutik plan's Area C (C.1, C.4, C.5, C.6). **Mert put it on hold** (decisions 10, 11); it is listed because it is the remaining hardcoded store data, not because it's approved (Q4).

- `tr_boutiques.editorial_skin` (+ public view). lilabutik's value is set by SQL, then `SLUG_SKINS` is deleted.
- Brand overrides and favicon go to columns (accent, logo and logo-on-dark exist already). `IntroLoader` and the reset-password accent read them. The 7 maps in `boutiqueBrand.ts` are deleted.
- Carrier: a `tr_boutique_integrations` row per store (token encrypted as the iyzico row is, `payments/credentialEncryption.ts`). `SHIPPING_BY_SLUG` and the env JSON are deleted.
- H14 slug checks are reviewed one by one: each is deleted, moved to a column, or documented as a platform rule (e.g. reserved subdomains).
- **Freeze:** yes (13 storefront files take the skin from context). **lilabutik:** identical; screenshot parity on home, PLP, PDP, cart, footer.

### F8: Lock it in (S)

- ESLint:
  - nothing outside `src/lib/tr/fashion/` imports it, except the template importers (categories, kinds, size types) and the size-guide figure;
  - no string literal equal to a live boutique slug outside `supabase/`, `scripts/` and tests (a small custom rule or a CI grep).
- Update the handoff docs (03, 04, 05, 06). Mark superseded sections of older plans as historical.

## 4. Order and dependencies

```
K2 merged + lilabutik on custom categories
        │
        ▼
       F1 ──► F2 ──► F3 (needs §7 answered)
                      │
       F4 ◄───────────┘ (any time after F2)
        │
        ▼
       F5 ──► F6
        
       F7 (independent; on hold)          everything ──► F8
```

- **F1–F4** are panel-heavy and moderate. They give the clean model: categories, kinds and fields, one editor, size charts.
- **F5–F6** are the expensive pair, and the only milestones that touch live checkout and stock.
- F3 can ship before F6 because the editor keeps the old size card for products not yet on variants.

## 5. Risks

| Risk | Where | Mitigation |
|---|---|---|
| Wrong kind backfilled, so a product shows the wrong fields | F2 | Generate the SQL from the tested mapping; SELECT counts per kind vs per category; the owner can change a product's kind, and it never deletes values |
| The owner loses a workflow they rely on | F3 | §7 answered first; lilabutik's owner tries the new editor behind a staff flag before the old flows are removed (as in Area A) |
| Merging colours loses content | F6 | Checklist per group; merged products are hidden, not deleted; the dry run shows everything first |
| Old cart lines / pending payments during the cutover | F6 | Map `(productId, size)` → variant via `merged_into` on cart load; old order lines keep the read-only `size` path; quiet-hour cutover |
| Stock drift | F6 | Single cutover, not dual-write; per-group stock sums checked before and after; old columns no longer written |
| Google feed item ids change | F5, F6 | Stable variant ids (`<productId>-<valueIds>`), product as `item_group_id`; check Merchant Center diagnostics after the first feed; expect a short re-review for the 16 merged items |
| Search ranking during the merge | F6 | 301s to the surviving product; one canonical per garment; resubmit the sitemap |
| lilabutik category URLs change | F1 | Redirects; one canonical per category |
| Broad freeze lifts | F1, F4–F7 | Each milestone asks for its own scoped lift |

## 6. Questions for Mert

1. **Adopt this as the target?** Four blocks, all store data (§1), with fashion reduced to a starter template. Recommendation: yes.
2. **F6 go-ahead:** sizes and colours onto variants for lilabutik, including merging colour groups with the checklist in F6. Recommendation: yes, but last, after F5 has sold a real two-colour test product.
3. **One category URL** (`/kategori/<slug>`, shop layout, redirects from `?kategori=`). Recommendation: yes, in F1.
4. **F7** (skin, brand, carrier to the DB) reopens decisions 10–11. Recommendation: schedule it before a second real store onboards.
5. **Start point:** F1 right after K2 is merged and lilabutik is switched? Recommendation: yes.

## 7. The existing AI features (not decided)

This plan's model has no AI in it: products are made by filling in the editor and adding photos. But lilabutik's current flows are built around AI:

- the wizard's AI try-on / packshot photos and house model;
- batch upload's AI category detection and listing drafts;
- takım's AI split;
- "AI ile doldur" in the editor;
- restyle;
- colour-variant photo generation.

F3 deletes the files these live in. What to do with them is Mert's call:

- **(a) Retire them.** The owner uploads real photos and writes listings by hand. Simplest; lilabutik's owner loses the AI photos and drafts. Existing AI-made photos stay on the products.
- **(b) Keep them as optional helpers on top of the generic editor, later.** For example, an "AI ile fotoğraf üret" button in the Fotoğraflar card or "AI ile doldur" in Temel bilgi. They would write only through the same product API and fields, so the model never depends on them. Not part of this plan; each would be its own milestone.
- **(c) Keep the current AI flows alive next to the new editor.** Not recommended: they depend on everything F2–F6 removes (garment ids from categories, `sizes`, colour groups).

My recommendation is (b) if the AI photos matter to lilabutik's owner, otherwise (a). Either way **F3 waits for this answer**.
