# No hardcoded store data: target architecture and plan

_Prepared 2026-09-30 on branch `main-t0o1c2`. **Planning only; nothing here is built.** Mert asked for the architecturally cleanest approach: "no hardcoded stuff". This plan starts from where `docs/fashion-beden-kategori-plan.md` (S1, K1, K2 built) left off. Where it reverses an earlier decision, it says so and lists that as a question. It does **not** assume those decisions are overturned._

## 0. The rule

> **Code says what the platform can do. The database says what a store has.**

The test for any piece of data: **could a new store set this up from the panel, without a deploy?** If not, it's hardcoded.

That doesn't mean "no constants in code". Two kinds of things stay in code on purpose:

- **Vertical knowledge.** For example: what a dress needs for an AI try-on, which photo slots a bottom has, how fabric maps to care copy, what the size-guide figure looks like. This is behaviour, it is versioned with the code, and every store gets the same one.
- **Starter templates.** For example: the fashion category tree, the Beden / Pantolon bedeni size types, default size-chart measurements. They live in code as seed data. They are **copied once** into a store's own rows (at creation, or with an "İçe aktar" button). After that, nothing reads the template at runtime.

What must **not** be in code: anything keyed by a store's slug, and any list the storefront or panel reads at runtime to decide what a store sells, how it's grouped, or how it looks.

## 1. Target model

Five building blocks. Each is owned by core (generic) or by a vertical (fashion, custom_art), and each has one source of truth.

| Block | What it answers | Source of truth | Owner |
|---|---|---|---|
| **Kind** (product kind) | "What is this thing?" Dress, top, trousers, skirt, set… Drives the editor, photo rules, AI pipeline, default size type, Özellikler fields | A **key on the product** (`tr_products.kind`). The list of kinds and their behaviour is vertical code | Vertical (registers kinds); core (stores the key) |
| **Categories** | "Where does a shopper find it?" Menu, PLP filters, category pages | `tr_categories` + `tr_product_categories`, per store | Core |
| **Variants** | "Which one exactly, and how many are left?" Size, colour, SKU, stock, price | `tr_variant_types` (with `role`) + `tr_product_options` + `tr_product_variants`, per store | Core |
| **Product groups** | "Which separate products are the same garment in another colour?" | A generic product-group table, per store | Core |
| **Store presentation** | Skin, brand, favicon, carrier, AI house models | Columns / rows on the boutique (`tr_boutiques`, `tr_boutique_integrations`) | Core |

The key separation: **kind ≠ category**. Today fashion works out "this is a dress" from the category (`isUstGiyimCategory`, `isAltGiyimSkirtLeaf`, `garmentCategoryFor` via `system_key`…). That ties the shop's menu to how the editor and AI behave:

- a renamed or re-parented category can change which photo slots a product gets;
- a product in "Yeni sezon" only has no garment meaning;
- `system_key` exists only to paper over this.

With a kind on the product:

- the owner can file a dress under "Abiye", "Yeni sezon" and "İndirim" and nothing about the dress changes;
- `system_key`, `garmentCategory.ts` and the category checks in `garmentUploadTypes.ts` go away.

### How the pieces talk

```
            ┌─────────── vertical (fashion) ───────────┐
            │ kinds + their rules (photo slots, AI,    │
            │ size-type default, Özellikler fields)    │
            │ starter templates (seed data, copied     │
            │ once): categories, size types, charts    │
            └──────────────┬───────────────────────────┘
                           │ registry (no direct imports from core/storefront)
┌──────────────────────────▼───────────────────────────────────────┐
│ core: products(kind) · categories · variant types/variants ·     │
│ product groups · boutique presentation · commerce (checkout,     │
│ inventory, orders, feed)                                         │
└──────────────────────────┬───────────────────────────────────────┘
                           │ reads data only
                  storefront (+ vertical slots: size-guide modal, PDP extras)
```

- The storefront and core **never import vertical code directly**. Verticals plug in through the existing registry pattern (the editor slot already does this, decision D6 of the lilabutik plan).
- The ESLint fashion boundary becomes: **nothing outside `fashion/` imports `fashion/`**, except the registry file.

## 2. Hardcoded today (inventory)

Verified on `main-t0o1c2` (`eee7188`).

| # | Hardcoded thing | Where | Becomes | Milestone |
|---|---|---|---|---|
| H1 | Built-in category tree as a runtime fallback (`legacy` mode) | `fashion/categories.ts`, `fashion/legacyTaxonomy.ts`, `category_mode` checks | Store data only; the tree is a starter template | F1 |
| H2 | Panel category labels and legacy picker read the code tree | `TrOwnerProductListPage`, `orders/TrOrderProducts`, `dashboard/TrDashboardTopSellers`, `TrOwnerCategoryPicker` | Read the store's categories | F1 |
| H3 | Two category URLs (`/urunler?kategori=` and `/kategori/<slug>`) | storefront links, `sitemap.ts` | One canonical URL | F1 |
| H4 | Homepage campaign links to fixed slugs (`elbise`, `ust-giyim`, `aksesuar`), lilabutik hero image paths, "…Lila'da" copy | `boutiqueHome/editorialContent.ts` (`buildAtelierTrends`, `buildAtelierHeroPromotions`, `midCampaign`) | Editorial content in the DB (`tr_boutiques.editorial_content`, which already exists), links by category **id** | F1 |
| H5 | Garment meaning inferred from the category | `garmentUploadTypes.ts` (`is*Category`, `constructionCatalogFamily`…), `garmentCategory.ts`, `tr_categories.system_key` | `tr_products.kind` | F2 |
| H6 | Two size charts and their cm tables | `fashion/sizeCharts.ts` (`LETTER_SIZE_CHART`, `NUMERIC_SIZE_CHART`), `catalog/productOptions.ts` (`DEFAULT_NUMERIC_SIZES`…) | Measurements stored on the store's size type; the code keeps only the defaults as a template | F3 |
| H7 | Sizes and per-size stock as columns on the product | `tr_products.sizes` / `size_stocks`, ~50 files (lilabutik plan §B.1) | Variants | F4, F5 |
| H8 | Colour groups inside a JSON blob | `features.colorGroupId`, colour-sibling code | Generic product groups | F6 |
| H9 | Özellikler fields fixed in code | `features` keys (gender, fit, fabric…), `dressFeatures.ts` | Attribute definitions per kind: vertical template, store-editable labels/options | F7 |
| H10 | Editorial skin by slug | `boutiqueHome/editorialSkin.ts` (`SLUG_SKINS`) | `tr_boutiques.editorial_skin` | F8 |
| H11 | Brand overrides by slug (7 maps), favicon | `storefront/boutiqueBrand.ts`, `seo/hostFavicon.ts` | Existing brand columns + a favicon column | F8 |
| H12 | Carrier by slug + token env JSON | `shipping/registry.ts` (`SHIPPING_BY_SLUG`), `TR_SHIPPING_BASITKARGO_TOKENS` | `tr_boutique_integrations` | F8 |
| H13 | AI house model by slug | `aiModel/registry.ts` (`BOUTIQUE_AI_MODELS`) | `tr_boutique_ai_models` (or a boutique column) | F8 |
| H14 | Other slug checks | `proxy.ts`, `customDomain.ts`, `panel/panelLogo.ts`, `TrOwnerSettingsPage`, `admin/boutique-health`, `TrBoutiqueAtelierHomeSections` | Reviewed one by one in F8; most are fallbacks with a DB path already | F8 |

## 3. Milestones

Each milestone ships on its own and leaves lilabutik working. The order follows the dependencies. Sizes are S / M / L, where L means a broad storefront + checkout change.

### F1: Categories are only data (M)

_Depends on: K2 merged, lilabutik switched to `custom` (steps in `fashion-beden-kategori-plan.md`)._

- The storefront, panel and sitemap read only `tr_categories`. Delete `legacyFashionTaxonomy`, the `legacy` branches and `fashion/categories.ts`'s runtime consumers. `categoryTemplate.ts` stays as the starter template.
- **New boutiques get the template at creation** (`scripts/create-boutique.mts`), so there is no "no categories yet" state for a fashion store. `category_mode` stays in the DB (additive-only), but the code stops reading it.
- **One URL per category: `/kategori/<slug>`**, rendered by the store's own PLP (atelier or classic), with filters as query params. `/urunler?kategori=x` redirects there. Only that URL is in the sitemap. Slug renames already record redirects (`catalog/categories.ts`).
- **Editorial content references categories by id**, and is resolved to the current slug/label at render. lilabutik's atelier defaults (`buildAtelier*`) move into its `editorial_content` row: a one-time SQL patch written from what the code produces today. The `buildAtelier*` code is then deleted.
- Panel labels (H2) read the store's categories.
- **SQL:** `patch_editorial_content_lilabutik.sql` (data only). **Freeze:** yes, storefront (links, `/kategori` layout). **lilabutik:** URLs change from `?kategori=` to `/kategori/`, with redirects in place.

### F2: Product kind (M)

- `tr_products.kind text null`: the vertical's key for what the product is.
- **The fashion kinds are the distinctions fashion code actually branches on today**, found by listing every `is*` / `family` helper in `garmentUploadTypes.ts`, `takimUpload.ts`, `dressFeatures.ts`, `careInstructions.ts` and the AI pipeline. Expected set: elbise, üst, pantolon (paça), etek, takım, dış giyim, aksesuar, ev. The final list comes from that audit, not from the menu.
- Each kind registers:
  - label;
  - photo slots and packshot rules;
  - AI pipeline settings;
  - default size type (by `role` + template key, not by name);
  - Özellikler fields (F7);
  - care-copy rules.
- **Backfill:** one SQL patch sets `kind` for every existing product from its current category, using the mapping that `garmentCategory.ts` implements today (generated by a script from the pure function, so the SQL and the code can't disagree). Checked with read-only SELECTs before and after: every product gets a kind, and the counts match the category counts.
- **Editor and create flows:**
  - "Ne satıyorsun?" picks the kind and drives the form.
  - "Nerede görünsün?" is the category picker (the store's categories, with the kind's usual category suggested).
  - Batch and takım uploads set the kind directly.
  - The AI listing draft proposes categories from the store's own list.
- **Deleted:** `garmentCategory.ts`, `system_key` usage (column stays), `categoryPayloadForGarment`, the category-based `is*` helpers. Q7 of the Beden & Kategori plan goes away: the wizard picks a kind, then any categories.
- **SQL:** `patch_product_kind.sql` (column + backfill). **Freeze:** no (panel only; the storefront doesn't need the kind until F3's size guide). **lilabutik:** no visible change.

### F3: Size charts are data (S–M)

- The cm measurements move onto the size type. Each value of a size-role variant type gets measurement rows (point → cm), plus a measure kind (body / garment). Either a `size_chart jsonb` on `tr_variant_types` or a small `tr_size_chart_rows` table; decide at build time on what the Beden drawer needs to edit it.
- The size-guide modal reads the product's size type's chart. The figure and the measuring hints stay fashion code (vertical knowledge).
- "Hazır bedenleri içe aktar" also imports the default measurements. A one-time patch fills lilabutik's two types with today's `LETTER_SIZE_CHART` / `NUMERIC_SIZE_CHART` values.
- A "Ölçü tablosu" section in the Beden drawer.
- **Deleted:** the chart tables and `detectSizeChart`-style detection from sizes (the product's size type tells which chart applies).
- **SQL:** `patch_size_charts.sql`. **Freeze:** yes, small (size-guide modal only). **lilabutik:** identical modal content.

### F4: Variants can be sold in the shop (L), formerly M7c-2 + M7c-3

- Product-page selectors, cart lines keyed by product + variant, a public read of active variants (view or RLS), a Google feed item per variant (`item_group_id` = product), Stok page rows per variant.
- The server half (M7c-1: checkout, inventory, cancel/restock per variant) is already built.
- Built for **all** products that have variants, not for fashion specifically. Proven on a Gelişmiş test product sold end to end before F5.
- **Freeze:** yes, broad (PDP, cart, checkout client, feed). **lilabutik:** none (it has no variant products yet).

### F5: Fashion sizes become variants (L)

**This reverses the lilabutik plan's §B.3 "defer Area B" recommendation. It needs Mert's explicit yes (Q2).**

- **New products:** the fashion editor, wizard, batch and takım write a Beden option + one variant per size (stock per variant) instead of `sizes` / `size_stocks`. The size table component already works on size types (S1), so it becomes a variant grid.
- **Existing products** (lilabutik: 93 sized products, about 900 variant rows):
  - A migration script creates the option + variants from `sizes` / `size_stocks`. It is idempotent and has a dry run that prints the per-product plan.
  - It runs once, checked with SELECTs: per product, the sum of variant stock equals the sum of `size_stocks` before.
- **Cutover:** one deploy switches checkout, inventory, cart and PDP for fashion products from the size map to variants.
  - Old carts in shoppers' localStorage hold `(productId, size)` lines. They are mapped to the variant with that size label on load (`useTrBoutiqueCartRevalidate` already re-checks lines); one that can't be mapped is dropped with the existing "no longer available" notice.
  - Pending iyzico holds and cancel/restock read the order line's `variant_id` when set, else the old `size` path. **The old path stays for old order lines only** (27 today), read-only.
- **After the cutover:** `sizes` / `size_stocks` are no longer written. The columns stay (additive-only) and are ignored. Every shopper-side `size` code path listed in §B.1 is deleted in the same change or the next.
- **SQL:** `patch_fashion_size_variants.sql` (data), run by Mert. **Freeze:** yes, broadest of all (checkout + inventory + PDP + cart + orders). **lilabutik:** no visible change if done right; this is the riskiest step in the plan.

### F6: Product groups (S–M)

- A generic "linked products" table: `tr_product_groups` (id, boutique, axis label e.g. "Renk") + `tr_products.group_id` + a per-product `group_value` ("Siyah", with an optional swatch).
- Any vertical can use it.
- Backfill from `features.colorGroupId` (28 products, 12 groups).
- The PDP colour siblings, related-products exclusion and the panel/AI colour-variant flow read the table.
- **This is not merging colours into variants.** Decision 8 of the lilabutik plan (colour-group products are never merged) stands: each colour keeps its own URL, photos, title and feed item. Variants' Renk remains available for stores that sell one product in several colours with shared photos.
- **SQL:** `patch_product_groups.sql` (schema + backfill). **Freeze:** yes, small (PDP siblings). **lilabutik:** identical.

### F7: Özellikler as definitions (M, optional)

- `tr_attribute_definitions` per store:
  - key, label, input type (choice / text), options, which kinds it applies to, sort order.
  - Seeded from the vertical's per-kind template (today's `dressFeatures.ts` groups, gender, fit, fabric…).
- Values stay in `features` jsonb, keyed by definition key, so existing data needs no migration.
- The editor renders the kind's definitions. The PDP spec list renders definitions with values.
- Store owners can rename labels, add options or add their own fields.
- **Freeze:** yes, small (PDP specs). **lilabutik:** identical.
- Optional because "no extra fields" (lilabutik plan Q6) is a product decision, not an architecture one. This milestone makes fields *definable*; it doesn't add any.

### F8: Store presentation leaves the slug maps (M)

This is the lilabutik plan's Area C (C.1, C.4, C.5, C.6, plus C.3's data half). **Mert put these on hold** (decisions 10, 11, 12). This plan lists them because they are the remaining hardcoded store data, not because they're approved (Q5).

- `tr_boutiques.editorial_skin` (+ public view). Resolver: column → `classic`. lilabutik's value is set by SQL, then `SLUG_SKINS` is deleted.
- Brand overrides and favicon go to columns (most already exist: accent, logo, logo-on-dark); `IntroLoader` and the reset-password accent read them. The 7 maps in `boutiqueBrand.ts` are deleted.
- Carrier: `tr_boutique_integrations` row per store (token encrypted at rest as the iyzico row is). `SHIPPING_BY_SLUG` and the env JSON are deleted.
- AI house models: `tr_boutique_ai_models` (name, reference images, measurements, prompt persona). The persisted id `boutique:lilabutik` stays valid as the row's key. Setting one up stays staff-only (decision 12: manual ops), but through data, not a deploy.
- H14 slug checks are reviewed one by one: each is deleted, moved to a column, or documented as a platform rule (e.g. reserved subdomains).
- **Freeze:** yes (13 storefront files take the skin from context instead of the slug). **lilabutik:** identical; verified by screenshots of home, PLP, PDP, cart and footer before and after.

### F9: Lock it in (S)

- ESLint:
  - `src/components/tr/boutique/**`, `src/app/tr/[boutiqueSlug]/**`, `src/lib/tr/commerce/**` and `src/lib/tr/catalog/**` may not import `@/lib/tr/fashion/**` or `@/components/tr/fashion/**` (the registry file excepted);
  - no string literal equal to a live boutique slug outside `supabase/` and tests (a small custom rule or a grep in CI).
- Update the handoff docs (03, 04, 05, 06) to describe the new model. Delete the superseded sections of the older plans or mark them historical.

## 4. Order and dependencies

```
K2 merged + lilabutik on custom
        │
        ▼
       F1 ──► F2 ──► F3
        │             │
        │             ▼
        │     F4 ──► F5
        │
        ├──► F6   (independent after F1)
        ├──► F7   (after F2: definitions are per kind)
        └──► F8   (independent; on hold)
                         all ──► F9
```

- F1–F3 are panel-heavy and moderate: the clean data model for categories, kinds and size charts.
- F4–F5 are the expensive pair: the only milestones touching live checkout and stock.
- If only part of this is wanted, **F1 + F2 give most of the architectural win**: categories become purely data, and the menu and the garment logic stop being tied together.

## 5. Risks

| Risk | Where | Mitigation |
|---|---|---|
| Wrong kind backfilled, so a product gets the wrong photo slots or AI prompt | F2 | Generate the SQL from the tested pure mapping; SELECT counts per kind vs per category before running; the editor shows the kind and lets the owner change it |
| Old cart lines / pending payments during the size → variant cutover | F5 | Map `(productId, size)` → variant on cart load; old order lines keep the `size` path read-only; run the cutover at a quiet hour; dry run the migration first |
| Stock drift between `size_stocks` and variants | F5 | Single cutover, not dual-write; per-product sum check before and after; the old columns are no longer written, so they can't diverge silently |
| Google feed item ids change | F4, F5 | Keep the product-level id as `item_group_id` and give variants stable ids (`<productId>-<size>`); check Merchant Center diagnostics after the first feed |
| lilabutik URLs change (`?kategori=` → `/kategori/`) | F1 | Redirects; one canonical URL per category; resubmit the sitemap |
| Atelier look regresses when its defaults move to `editorial_content` | F1, F8 | Generate the row from what the code renders today; screenshot parity on home, PLP, PDP, cart, footer |
| Broad freeze lifts | F1, F3–F8 | Each milestone asks for its own scoped lift, as before |

## 6. Questions for Mert

1. **Adopt this as the target?** "Code = what the platform can do, DB = what a store has", with the five blocks in §1. Recommendation: yes.
2. **F5 (fashion sizes → variants)** reverses the earlier "defer Area B". Architecturally it's the only way to have one stock model. It is also the riskiest change to lilabutik's live checkout. Recommendation: **yes, but last**, after F4 has sold a real Gelişmiş product, as §B.3 required.
3. **One category URL (`/kategori/<slug>`, shop layout) with redirects from `?kategori=`?** (Q8 of the Beden & Kategori plan.) Recommendation: yes, as part of F1.
4. **F7 (definable Özellikler):** in scope, or keep the fixed fields since you decided "no extra fields"? Recommendation: in scope, but after everything else. It removes hardcoding without adding fields.
5. **F8 (skin, brand, carrier, AI model to the DB)** reopens decisions 10–12, which you put on hold. Recommendation: schedule it before the second real store onboards, not before.
6. **Start point:** F1 right after K2 is merged and lilabutik is switched? Recommendation: yes. F1 and F2 give most of the win at moderate risk.
