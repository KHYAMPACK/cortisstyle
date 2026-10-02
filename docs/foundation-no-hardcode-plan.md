# No hardcoded store data: target architecture and plan

_Prepared 2026-09-30 on branch `main-t0o1c2`. **F0 built (2026-09-30); F1 built (2026-10-02) except the editorial-content move; F2 built (2026-10-02); F3–F8 are planning only.** Mert asked for the architecturally cleanest approach: "no hardcoded stuff". This plan starts from where `docs/fashion-beden-kategori-plan.md` (S1, K1, K2 built) left off. Where it reverses an earlier decision, it says so and lists that as a question._

_Revised 2026-09-30 after two decisions from Mert:_

- **Colours become variants.** Colour-group products merge into one product with a Renk option. This reverses decision 8 of the lilabutik plan.
- **The model is designed as if there were no AI pipeline.** People fill in product info and add photos by hand. Nothing in the data model, the editor or the shop depends on AI.
- **The AI pipeline is parked, not deleted** (Mert, 2026-09-30). It is archived intact, documented, and removed from the running code (F0). Once the data model is solid, it comes back as a layer on top of it (§7).

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

The AI house-model registry (`aiModel/registry.ts`) is also slug-keyed. It leaves with the AI pipeline in F0 and is redesigned as data when the pipeline returns (§7).

## 3. Milestones

Each milestone ships on its own and leaves lilabutik working. The order follows the dependencies. Sizes are S / M / L, where L means a broad storefront + checkout change.

### F0: Park the AI pipeline (S–M) — **built 2026-09-30**

**Built:**

- The code is intact at commit `8aba2be` on `main`. The cloud session could only push its working branch, so the named tag is a one-liner for Mert, in `docs/ai-pipeline-v1.md`.
- The pipeline is documented in `docs/ai-pipeline-v1.md`.
- **Removed:** the AI libraries and API routes, the AI screens, background removal on upload (Q7), the model plates (`public/tr/ai-models/`), and the plate scripts.
- **Manual-only now:** the wizard, Toplu ekle and Takım run their existing "Elle ekle" path, so their draft keys were bumped and old AI drafts are dropped.
- **Fashion editor:**
  - a hand-added product keeps its plain gallery;
  - an AI-made product shows its shop gallery read-only, with "Fotoğrafları düzenle" to turn it into a plain list;
  - nothing changes for existing products until the owner does that.
- **Other panel changes:** the product list lost "Packshot + model", and the dashboard lost the credits card.
- The shop's image logic is untouched.
- Q6 answered: the owner isn't told.

The rest of this section is the plan as approved.

**Why first:**

- The AI flows are threaded through exactly the code F2–F6 replace: garment ids from categories, `sizes`, colour groups, photo slots, the wizard and batch flows.
- Keeping them working through every step would roughly double the work of F2, F3 and F6, and would pull the new model towards the old shape.
- Taking them out first means each later step changes only plain data and plain forms.

**Live usage** (read-only, 2026-09-30): lilabutik ran 543 AI jobs (336 packshots, 207 try-ons), the last on 2026-08-31, **none in the last 30 days**. Parking it doesn't interrupt anything in use right now. The owner will add new products with their own photos until it returns.

**1. Archive.** Nothing is lost:

- a git tag **`ai-pipeline-v1`** and a branch **`archive/ai-pipeline-v1`** on the last commit that still contains the pipeline;
- the tag is never moved, and the branch is never merged.

**2. Document.** `docs/ai-pipeline-v1.md`, written from the code before it is removed:

- what each step does: packshot, try-on, elbise construction lock and restyle, takım sequential try-on, colour-variant photos, listing draft / "AI ile doldur", batch detection, house models, background removal;
- its files, API routes and providers (FASHN, Photoroom, the LLM provider switch);
- env vars, credits and costs (`uploadCostHints.ts`, `ai-credits`);
- the prompts, and the data it writes (images, `features.aiModelId`, `tr_ai_usage_events`);
- what worked, what didn't, and what the return should keep.

The prompts and provider clients are the most valuable parts to preserve.

**3. Remove from the running code.**

| What goes | Files |
|---|---|
| AI libraries | `src/lib/tr/ai/`, `src/lib/tr/aiCatalog/`, `src/lib/tr/aiModel/`, `src/lib/tr/fashion/aiCatalog/`, `src/lib/tr/fashion/fashn/`, `src/lib/tr/aiUsage.ts` (≈5,300 lines) |
| API routes | `/api/tr/owner/ai-catalog/*` (listing-draft, packshot, prepare-packshot), `/api/tr/owner/ai-credits`, `/api/tr/owner/ai-model/generate` |
| AI-only panel UI | `TrOwnerAiCatalogEnhance`, `TrOwnerAiFillListing`, `TrOwnerAiJobQueue`, `TrOwnerModelShotProgress`, `TrOwnerWizardPipelineStatus`, `TrOwnerColorVariantPhotos`, `TrOwnerCreditsInfo`, `fashion/panel/TrOwnerAiModelPicker`, `fashion/panel/TrOwnerElbiseRestyleQueue`, `TrOwnerBatchModelsStep` |
| AI steps inside shared flows | the wizard, batch (photo, chips, listings steps) and takım flows, and the fashion editor lose their AI steps and buttons and keep plain photo upload + manual fields. These files are deleted wholesale in F3, so F0 only removes the AI parts they need to keep compiling and working |

**What stays:**

- all data: AI-made photos stay on products and in the shop; `features.aiModelId` and `tr_ai_usage_events` stay in the DB, unwritten (additive-only);
- the env vars can stay set in Vercel, unused.

**Q7 (decided: park it).** The upload route (`/api/tr/owner/upload`) ran Photoroom background removal on front/back photos to make the marketplace cutout (`marketplaceUrl`). It is parked with the pipeline: uploads keep the original only, and existing cutouts stay.

**Freeze:** no (panel and owner API only; the shop shows the same images). **lilabutik:** the owner's AI buttons, AI photo steps and credits page disappear until the pipeline returns.

### F1: Categories are only data (M)

**Built (2026-10-02), on `main-t0o1c2`, not merged yet.** F1a: category pages live at `/kategori/<slug>` and render the store's own PLP (`catalog/plpLocation.ts` keeps the category in the path and the filters in the query; `/urunler?kategori=x` redirects there with a 308; `sale` stays `indirim=1` on `/urunler`). F1b: `category_mode` is no longer read anywhere and `fashion/legacyTaxonomy.ts` is deleted; the storefront, sitemap and `/kategori` pages always use the store's `tr_categories` (a store without any shows an empty category menu); the panel's labels (Ürünler list, Stok chips, order lines, dashboard top sellers) and the fashion editor's picker read the store's categories; a new store gets its profile's starter tree when it is created (`catalog/starterDefinitions.ts`, called from the admin seed route that `scripts/create-boutique.mts` uses); "Hazır kategorileri içe aktar" is offered to any fashion store with no categories. **Skipped for now (Mert, 2026-10-02):** the editorial-content move below (H4); `buildAtelier*` still renders lilabutik's defaults. **Still on the built-in garment list until F2:** the create wizard and batch (`TrOwnerCategoryPicker`); they file the product under the store's category carrying that garment's key.


_Depends on: K2 merged and lilabutik switched to `custom` (steps in `fashion-beden-kategori-plan.md`)._

- The storefront, panel and sitemap read only `tr_categories`. Delete `legacyFashionTaxonomy`, the `legacy` branches and every runtime consumer of `fashion/categories.ts`. `categoryTemplate.ts` stays as the template.
- **New stores get the template at creation** (`scripts/create-boutique.mts`). `category_mode` stays in the DB (additive-only), but the code stops reading it.
- **One URL per category: `/kategori/<slug>`**, rendered by the store's own PLP (atelier or classic), with filters as query params. `/urunler?kategori=x` redirects there. Only that URL is in the sitemap. Slug renames already record redirects.
- **Editorial content references categories by id**, resolved to the current slug/label at render. lilabutik's atelier defaults (`buildAtelier*`) move into its `editorial_content` row: a one-time data patch generated from what the code renders today. The `buildAtelier*` code is then deleted.
- Panel labels (H2) read the store's categories.
- **SQL:** `patch_editorial_content_lilabutik.sql` (data). **Freeze:** yes (links, `/kategori` layout). **lilabutik:** category URLs change, with redirects.

### F2: Product kinds and fields are data (M)

**Built (2026-10-02), on `main-t0o1c2`, not merged yet.** What differs from the plan below:

- **Schema** (`supabase/patch_product_kinds.sql`): as planned, plus `tr_product_kinds.system_key` (the template's id, like `tr_categories.system_key`, so F3 and the AI return can tell a kind apart after a rename) and `tr_product_kind_attributes.options` (a kind can offer a narrower option list: Boy is Mini…Maxi for Elbise and Crop…Tunik boy for Üst giyim). Inputs are `text` / `textarea` / `choice`; a choice has `allow_custom` ("pick or type") because live data has wordings outside the chip lists (lilabutik: Kumaş "Hafif dokuma", Kalıp "Relaxed"). No `multi` input: nothing uses one today.
- **Template** (`fashion/kindTemplate.ts`): built from `dressFeatures.ts`; a test checks each garment kind has exactly the editor's fields and options. Kinds: Elbise, Üst giyim, Etek, Pantolon (with eşofman), Takım, Aksesuar, Ev tekstili. Fields: Cinsiyet, Yaka, Kol, Kalıp, Boy, Dekolte, Bel, Paça, Kumaş, Fermuar, Esneklik, Silüet, Detay, Renk, Kompozisyon. Deviations: "Yaka / Paça detay" (free text on the plain grid) shares its key `neckHem` with Paça, so it is only on Pantolon (old values stay on products and on the PDP); Kalıp is left off Aksesuar and Ev tekstili.
- **No backfill SQL.** "Hazır türleri içe aktar" (Tanımlamalar → Ürün türleri) creates the kinds and fields and gives every product without a kind the one its category maps to, with the tested mapping (`fashionKindKeyForCategory`, through system keys). Simulated on lilabutik's live tree: all 94 products get a kind (Elbise 52, Üst giyim 22, Pantolon 15, Takım 3, Etek 2). New stores get it at creation (`catalog/starterDefinitions.ts`). Starting variant types are filled only when the store has a type of that name ("Beden", "Pantolon bedeni"); lilabutik has none yet, so they stay empty until set in the drawer.
- **Panel:** Tanımlamalar → Ürün türleri (list + drawer: name, starting variant types, suggested category, fields with order / Zorunlu / option subset) and Özellikler (list + drawer: label, input, options, "pick or type"). Ürünler list: Tür column, Tür filter, "Tür ata…" bulk action.
- **For F3:** `sanitizeProductFeatures` keeps only the built-in keys today, so a field the owner creates can't hold a value until the editor saves `features` by the boutique's own field keys. Show a stored value that isn't in a choice's options as a selected chip (never drop it).

**To switch it on (Mert):** apply `supabase/patch_product_kinds.sql`, then on each fashion store: Tanımlamalar → Ürün türleri → "Hazır türleri içe aktar". Read-only check afterwards:

```sql
select k.name, count(p.id) as products
from tr_products p join tr_boutiques b on b.id = p.boutique_id
left join tr_product_kinds k on k.id = p.kind_id
where b.slug = 'lilabutik' group by k.name order by 2 desc;
```


- **Schema:** `tr_product_kinds`, `tr_attribute_definitions`, `tr_product_kind_attributes`, plus `tr_products.kind_id uuid null`.
- **Panel:** Tanımlamalar → **Ürün türleri** (list + drawer: name, starting variant types, suggested category, fields) and **Özellikler** (field definitions: label, input, options). Same patterns as the Kategoriler and Varyant Türleri pages.
- **Template:** the fashion kinds and fields come from what the fashion editor shows today. The kinds are the distinctions the current code actually makes (expected: Elbise, Bluz / Üst, Pantolon, Etek, Takım, Dış giyim, Aksesuar); the fields are today's `features` keys and `dressFeatures.ts` groups, with their option lists. "Hazır türleri içe aktar" creates them. **No extra fields are added** (lilabutik plan Q6).
- **Backfill (built differently, see above):** one data patch sets `kind_id` for every existing product from its current category (generated from the tested mapping in `garmentCategory.ts`, so the SQL and the code can't disagree). Checked with read-only SELECTs: every product gets a kind, and the counts match the category counts.
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
- **Deleted at the end of F3:** `TrFashionProductEditor`, `TrProductCreateWizard` + drafts, the batch pages (6 files), `TrOwnerTakimCreatePage`, `TrOwnerFashionCreateChooser`, `fashion/productForm.ts`, `productPhotoChecks.ts`, the editor registry slot, `garmentUploadTypes.ts`, `garmentCategory.ts`, `categoryPayloadForGarment`. `product_type` stops being read (column stays). Their AI parts are already gone (F0); the archive tag keeps the full versions.
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
       F0 ──► F1 ──► F2 ──► F3
                      │
       F4 ◄───────────┘ (any time after F2)
        │
        ▼
       F5 ──► F6
        
       F7 (independent; on hold)          everything ──► F8
```

- **F0** comes first because it makes every later step smaller. It is independent of K2 and could even go before it.
- **F1–F4** are panel-heavy and moderate. They give the clean model: categories, kinds and fields, one editor, size charts.
- **F5–F6** are the expensive pair, and the only milestones that touch live checkout and stock.
- F3 can ship before F6 because the editor keeps the old size card for products not yet on variants.

## 5. Risks

| Risk | Where | Mitigation |
|---|---|---|
| Wrong kind backfilled, so a product shows the wrong fields | F2 | Generate the SQL from the tested mapping; SELECT counts per kind vs per category; the owner can change a product's kind, and it never deletes values |
| The owner loses a workflow they rely on | F0, F3 | AI unused for 30 days (checked); tell the owner before F0 ships; lilabutik's owner tries the new editor behind a staff flag before the old flows are removed (as in Area A) |
| Parked AI code is hard to bring back | F0, §7 | Commit `8aba2be` (and the tag, once made) keeps it intact; `docs/ai-pipeline-v1.md` records how it worked; the return is designed against the new model rather than restored as-is |
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
5. **Start point:** F0 is done; F1 right after lilabutik is switched to its own categories (K2 is merged)? Recommendation: yes.
6. ~~Tell lilabutik's owner before F0 ships?~~ **Decided: no** (Mert, 2026-09-30).
7. ~~Background removal on upload?~~ **Decided: park it with the pipeline** (Mert, 2026-09-30).

## 7. Bringing the AI pipeline back (later)

**Decided (Mert, 2026-09-30):** the pipeline is parked in F0, not deleted, and returns once the data model (F1–F6) is solid. It comes back **as a layer on top of the model, never inside it.**

**Rules for the return:**

- **AI is a client of the product API.** It reads a product (kind, fields, variants, photos per colour) and writes only through the same endpoints and fields the editor uses. No AI-only columns on products and no AI-only product states. The model must work identically with the AI layer switched off.
- **AI proposes, the owner accepts.** Generated photos and drafted text land as suggestions in the editor (e.g. a "Önerilen fotoğraflar" strip in the Fotoğraflar card, a "Taslak" in Temel bilgi / Özellikler) and are saved with Kaydet like anything typed by hand.
- **Configuration is data, not code:**
  - house models are rows (`tr_boutique_ai_models`: name, reference images, measurements, persona), not `BOUTIQUE_AI_MODELS`;
  - per-kind AI settings (which photo types to generate, prompt hints) hang off `tr_product_kinds` as an optional jsonb, not off category ids;
  - the persisted id `boutique:lilabutik` stays valid as a row key.
- **Jobs are generic:** one AI job table (job type, product, input, output, cost, status), extending `tr_ai_usage_events`, with one queue UI. Not a pipeline per garment family.
- **What to reuse from `ai-pipeline-v1`:** the provider clients (FASHN, Photoroom, LLM switch), the prompts, and the lessons in `docs/ai-pipeline-v1.md`. **What not to reuse:** anything keyed on garment categories, `sizes`, colour groups or photo slots. Those are exactly what the new model replaced.

**Suggested return order, each its own milestone once F6 is done:**

1. AI ile doldur: text and Özellikler from photos, per kind's fields.
2. Packshot / background removal on a colour's photos.
3. Try-on with house models.
4. Photos for a new colour.
5. Bulk: run a job over many products.
