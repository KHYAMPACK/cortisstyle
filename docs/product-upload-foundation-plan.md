# Product upload foundation — product types, editor blocks, categories, SEO

_Prepared 2026-09-24 on branch `panel-products`. Facts below were checked against the repo and the live Supabase project (`qjxclaggqzhfaqihwdle`, read-only) the same day. This is a **plan**, not built yet. Inputs: Mert's ikas screenshots (Basit ürün, Kategoriler, Tanımlamalar) and his decisions in §1._

## 0. Goal and rules

Every store gets two generic product types, **Basit ürün** and **Gelişmiş ürün**. A vertical adds its own types on top (fashion adds a third, **Moda ürünü**, which opens Takım / Tek parça / Toplu). The panel copies ikas's *structure* (pages, fields, flows), not its colors or logo.

Rules for the whole effort:

- **Additive SQL only.** Mert runs each patch by hand in Supabase. Nothing here may change how lilabutik (94 live products) looks, is priced, or is checked out. Existing product URLs keep working.
- **No dormant code.** A field ships only with its whole path (form → database → consumer), *except* the four fields Mert explicitly wants stored-only (§1). Those are labeled as informational in the panel.
- **Build shared blocks once.** The SEO card, the rich-text field, the image field and the editor layout are reused by products, categories and later entities.
- **Fashion stays walled off.** Core knows only the id `fashion` and its routes. Garment code stays under `src/*/fashion/` (ESLint boundary, see `agent-handoffs/06-fashion-module.md`).

## 1. Decisions (Mert, 2026-09-24)

| Topic | Decision |
|---|---|
| Types | Basit + Gelişmiş for every vertical; fashion gets a third option that opens a sub-choice (Takım, Tek parça sihirbazı, Toplu ekle) |
| Gelişmiş | = Basit + a **Varyant** card. The variant system is proposed in §8 and awaits Mert's confirmation; its create-in-place UI is the shared drawer |
| Categories | Multiple per product, one **primary** ("Ana Kategori"). **Unlimited depth.** Normal categories only — **no dynamic (rule-based) categories** |
| Where categories live | Ürünler → **Tanımlamalar** hub. The hub shows **only Kategoriler** for now; the other ikas cards (Markalar, Etiketler, Özel Alanlar, Varyant Türleri, Ürün Grupları, Tedarikçiler, Ürün Kişiselleştirmeleri, Ürün Birimleri, Sepet Linki) are added when something needs them |
| Assigning categories | From the product editor (create and edit) and as a bulk action in the Ürünler list |
| Stored-only optional fields | Ürün türü **Dijital**, **HS kodu**, **Tedarikçi**, **Lokasyon**. Created as in ikas, optional, saved, *not* wired into checkout / shipping / purchasing |
| Lokasyon | Shows the boutique's own address as **"Ana adres"**, read-only |
| Stok | Its **own section**, separate from Lokasyon (ikas merges them) |
| Sıralama ölçütü | Exactly six options (nothing below "Yeniden Eskiye"): En çok satanlar, İndirim oranına göre azalan / artan, Fiyata göre azalan / artan, Yeniden eskiye |
| Create-in-place drawer | ikas opens a **right-side drawer** for creating definitions (Varyant türü oluştur, and more). One shared drawer component serves all of them (§4, §8) |
| Variant creation | Mert could not work out ikas's flow, so §8 proposes the system |
| Later | Özel Alanlar and Ürün Özelleştirmesi tabs |
| Slug changes | Old URL **redirects** to the new one (Mert had no preference; this is my default) |

## 2. Where we are today (verified)

- `tr_products` is one table with **no type column**. `POST /api/tr/owner/products` is already generic (title, price, stock, images, category, description, `features` jsonb, sizes/colors/size_stocks). Fashion markers live in `features` (`uploadKind: "takim"`, `manualListing`).
- **`tr_products` has a public (anon) SELECT policy** on available/sold rows, all columns. Anything owner-only (cost price, supplier, HS code) must **not** be a column there.
- The fashion product page does **not render `description`** (only the custom-art panel does). It is used for meta description, the Google feed and AI fill.
- `/api/tr/owner/upload` accepts png/jpeg/webp only; product limit is 8 images. No video, no HEIC.
- Products are served by id (`/tr/[slug]/urun/[productId]`, `safeGetPublicProductByBoutiqueSlugAndId`); the sitemap uses the same id path. There is no slug.
- Categories are a **fixed fashion tree in code** (`src/lib/tr/fashion/categories.ts`, ~14 files import it). Custom categories exist only as strings. Storefront browsing is `urunler?kategori=<id>&sira=…` with four client-side sorts (default, price up, price down, new). lilabutik's categories: elbise 52, pantolon 15, bluz 11, ceket 6, gömlek 3, takım 3, etek 2, tişört 2, none 1 — all present in the code tree.
- A Google Merchant feed already exists (`src/lib/tr/googleMerchant/feed.ts`): brand = boutique name, product type = category, availability from stock, no gtin/mpn/google category.
- Stock decrement rejects when stock < quantity (`src/lib/tr/commerce/inventory.ts`). `DEFAULT_APPAREL_PACKAGE` in `shipping/types.ts` is a placeholder "until owner can set desi".
- `tr_boutiques` has `shipping_address`, `physical_address`, `return_address`.
- The current `/urun/yeni` wizard and `TrProductEditorForm` are the fashion editors. `/urun/takim` and `/urun/toplu` are fashion wizards.

## 3. Product types and routing

**Stored on the product:** `tr_products.product_type text not null default 'simple'` with a check for `('simple','advanced','fashion')`. Existing rows are backfilled to `'fashion'` (all current products came from the fashion flows). The type decides which editor `/urun/[id]` opens, so it must be stored, not guessed.

**Registry:** `src/lib/tr/productTypes/registry.ts` lists the types (id, label, description, create route). `catalogProfileCapabilities(profile).productTypes` says which a vertical offers: fashion `[simple, advanced, fashion]`, `custom_art` `[]` (products stay hidden). A vertical with one type skips the chooser. The registry imports nothing from `fashion/`; the fashion sub-chooser lives in `src/components/tr/fashion/panel/`.

**Routes** (all editor routes → `PANEL_EDITOR_ROUTES`, which needs new patterns because some are two segments deep):

```
/tr/panel/urun/yeni                    type chooser
/tr/panel/urun/yeni/basit              Basit ürün
/tr/panel/urun/yeni/gelismis           Gelişmiş ürün
/tr/panel/urun/yeni/moda               fashion sub-chooser
/tr/panel/urun/yeni/moda/tek-parca     today's wizard, unchanged
/tr/panel/urun/takim, /urun/toplu      unchanged (linked from the moda chooser)
/tr/panel/urun/[id]                    dispatches on product_type
```

## 4. Shared building blocks

| Block | Used by | Notes |
|---|---|---|
| `TrPanelEditor` + tabs + cards | every editor | **done** (commit `059c175`) |
| `TrPanelSeoCard` | product, category, later brand/pages | §6 |
| `TrPanelRichTextField` | product description, category description | editor lib + server-side HTML sanitizer used on write **and** render |
| `TrPanelImageField` | category image, later others | single image; the multi-image gallery for products already exists (`TrOwnerManualPhotoGallery`, generic) |
| `TrPanelCreatableSelect` | Marka, Etiket | type a value or pick one already used in the boutique |
| `TrPanelCategoryPicker` | product editor | multi-select tree with a primary marker, `⋯` menu (make primary / remove), "Kategorileri Düzenle" |
| `TrPanelPopover` | done | filters and menus |
| `TrPanelDrawer` | Varyant türü oluştur/düzenle, inline "yeni marka/etiket/kategori/…" from any editor, later Özel Alan, Ürün Birimi | right-side slide-over: title + close, scrolling body, sticky footer with Vazgeç / Kaydet. Dims the page, closes on Esc and backdrop click, traps focus, returns focus to the trigger, asks before discarding edits. Full-screen on phones. Stacks above the editor top bar and below the leave-guard dialog |

**Save model.** Basit/Gelişmiş use an explicit **Kaydet** (with the existing leave guard), like ikas. The fashion editor keeps autosave. Reason: a slug edit must not autosave on every keystroke and create redirects.

## 5. Basit ürün — card by card

| Card | Fields | Storage | Status |
|---|---|---|---|
| Temel bilgi | Ürün adı, Ürün türü (Fiziksel/**Dijital**), Satış fiyatı, İndirimli fiyat, **Alış fiyatı**, birim fiyat göster (+ unit fields), Durum | `title`, `fulfillment_type`, `price_kurus`, `compare_at_price_kurus`; cost in **private table**; `unit_price_enabled/unit_amount/unit_type` | Dijital = stored-only; unit price shown under the price on the product page |
| Medya | images (existing gallery, ≤8, png/jpeg/webp) | `images` | video + HEIC → M6 |
| Ürün detayı | Marka, Etiket, Google ürün kategorisi, **Tedarikçi**, Kategori (§7), Açıklama (rich text) | `brand text`, `tags text[]`, `google_category text`, supplier in private table, join table, `description_html` + derived plain `description` | Tedarikçi stored-only |
| Envanter | SKU, Barkod, Kargo: Desi, **HS kodu** | `sku`, `barcode`, `desi`; `hs_code` in private table | SKU/barkod → feed `mpn`/`gtin`; desi → carrier label; HS kodu stored-only |
| Stok | Stok adedi, "Stoğu tükenince satmaya devam et" | `stock`, `continue_selling_when_out_of_stock` | flag changes inventory decrement, cart/product page availability and feed availability |
| Lokasyon | "Ana adres" (read-only) | from `tr_boutiques.shipping_address`, fallback `physical_address` | stored-only, informational |
| SEO | shared card | §6 | |

Notes:

- **Description:** `description_html` holds sanitized HTML; `description` stays plain text, derived with `stripHtml` on save, so the meta description, the feed and AI fill keep working unchanged. The product page gets an Açıklama section (today it shows none).
- **Marka / Etiket / Google kategorisi** start as creatable free text (no Tanımlamalar pages yet, per Mert). When Markalar/Etiketler pages are built later, distinct existing values become rows. Google kategorisi starts as text the feed emits; a taxonomy picker can follow.
- **"Açıklama Oluştur" (AI)** reuses the existing listing-draft endpoint if it works without garment upload types; otherwise it follows later.

## 6. Shared SEO

One component, one data shape, one server module — used everywhere ikas shows the SEO card.

- **Card (`TrPanelSeoCard`):** Slug (`/` prefix, 185), Sayfa başlığı (256), Açıklama (320), Gelişmiş: "Bu sayfayı arama motorlarının taramasını engelle" (noindex), Canonical URL; a live search-result preview beside it. Props: entity name, base path, fallback description, boutique host.
- **Data:** `slug text` as a real column on each entity table, `unique (boutique_id, slug)`; everything else in `seo jsonb` (`title`, `description`, `noindex`, `canonical`).
- **Server module** (`src/lib/tr/seo/`): slug generation (Turkish transliteration; the product form's slugifier moves here), uniqueness with `-2` suffixes, `buildMetadata(entity)` for `generateMetadata`, sitemap and noindex rules.
- **Redirects:** `tr_slug_redirects (boutique_id, entity_type, old_slug, entity_id)`. Renaming a slug inserts the old one; the storefront route checks it before returning 404.
- **Existing products:** `slug` stays **null** for the 94 lilabutik products. Null means the URL and canonical remain the id URL, so indexed URLs don't change. New products get an auto slug from the title; the owner can edit it.
- **Routes:** product page resolves slug first, then id. Categories get `/tr/[slug]/kategori/[slug]` (flat slug; hierarchy shows in breadcrumbs). `urunler?kategori=<id>` keeps working and redirects to the slug URL.

## 7. Categories

**Tables**

```sql
tr_categories (id, boutique_id, parent_id null → self, name, slug, description_html,
               image_url, sort_criterion, seo jsonb, sort_order, created_at, updated_at,
               unique (boutique_id, slug))
tr_product_categories (product_id, category_id, is_primary,
                       primary key (product_id, category_id),
                       partial unique (product_id) where is_primary)
```

- `sort_criterion` has exactly six values (confirmed by Mert): `best_selling`, `discount_desc`, `discount_asc`, `price_desc`, `price_asc`, `newest`; null = the store's default order. "En çok satanlar" needs sales counts from `tr_order_items` (grouped query, cached).
- **`tr_products.category` stays** as a copy of the primary category's slug, written in one place, so filters, the feed and the ~14 storefront files keep working during the switch.
- **Rules:** unlimited depth, no cycles (server check), deleting a category moves its children up one level and unassigns products; if a product's primary is removed, the next category becomes primary (or none).
- **Seed and backfill (SQL patch):** every boutique with `catalog_profile = 'fashion'` gets the current code tree as its categories (slug = existing id, so `elbise`, `pantolon`… match), and every product with a `category` gets one primary row. Style variants (`kase-kaban`, `kot-pantolon`, …) are seeded too and marked hidden from the menu so old products keep matching.
- **Storefront switch:** menu and category pages read `tr_categories`; until a boutique has rows, the code tree is the fallback. The menu shows two levels; deeper categories are reached via category pages and breadcrumbs (menu design for deep trees is out of scope).

**Panel**

- `Tanımlamalar` nav child under Ürünler → `/tr/panel/tanimlamalar` (hub, one card: Kategoriler).
- `/tr/panel/tanimlamalar/kategoriler`: search + Filtre, tree list (Ad, Sıralama ölçütü, ürün sayısı), "Kategori ekle". No Normal/Dinamik tabs.
- `/kategoriler/yeni` and `/kategoriler/[id]`: editor with Temel bilgi (ad, ebeveyn, açıklama, görsel), Ürünler (sıralama ölçütü), SEO.
- Ürünler list bulk bar: "Kategori ekle" (adds; sets primary only when the product has none).

## 8. Gelişmiş ürün — variants (proposal)

Gelişmiş = Basit + a **Varyant** card. Mert couldn't work out from ikas how a variant actually gets created, so this is the system I propose: the standard two-step model (define an option once, then combine its values per product), built on the shared drawer.

### 8.1 Three concepts

1. **Varyant türü** (option type), defined **once per boutique** under Tanımlamalar → *Varyant Türleri*: a name (Renk, Beden, Boyut…), a **selection style** (*Liste* = text chips such as S / M / L; *Renk / Görsel* = swatches, each value with a color and/or an image) and an ordered list of values. This is the "Varyant Türü Oluştur" drawer in Mert's last screenshot.
2. **Product options.** A Gelişmiş product picks which types it uses (max **3**) and which values of each apply (a subset, e.g. Renk: Kırmızı, Mavi; Beden: S, M, L).
3. **Variants.** One sellable row per combination of the chosen values (Kırmızı / S, Kırmızı / M, …). Each row has: active toggle, SKU, barkod, **price** (blank = inherits the product's price), **stock**, and images (a subset of the product's media). Max **100** rows per product.

### 8.2 The creation flow

1. On the product, the Varyant card starts empty ("Henüz bir varyant eklemediniz") with **Varyant Ekle**.
2. **Varyant Ekle opens the drawer.** Step 1: tick the variant types to use, from the boutique's list. If the type doesn't exist yet, **Yeni varyant türü** opens the same drawer form as the Varyant Türleri page, so a type can be created without leaving the product.
3. Step 2, per chosen type: pick values (chips from that type's list; **+ yeni değer** adds one to the type's list on the spot).
4. **Kaydet** generates every combination as a row in the card's table. The card then shows the option summary (Renk: Kırmızı, Mavi · Beden: S, M, L) and an editable table: Varyant, SKU, Barkod, Fiyat, Stok, Aktif.
5. **Toplu düzenle** sets price / stock for all rows, or for every row of one value ("all Kırmızı"). Adding or removing a value later regenerates rows: rows for surviving combinations **keep their data**, new combinations arrive blank, removed ones are dropped after a confirm.
6. Rules: with **zero** variants a Gelişmiş product sells exactly like a Basit one (product-level price, SKU, stock). Once variants exist, the product-level SKU / barkod / Stok inputs are replaced by the table, and the product price becomes the default that rows inherit.

The Varyant Türleri page mirrors the Kategoriler pattern: list (Ad, Seçim stili, Varyantlar, kullanan ürün sayısı), "Varyant Türü Ekle" opens the drawer, a row click opens it in edit mode, empty state as in ikas. It becomes the second card on the Tanımlamalar hub (it is "needed" now, per Mert's add-when-needed rule). A type in use by products can't be deleted; renaming a value updates it everywhere.

### 8.3 Data model (sketch, additive)

```sql
tr_variant_types        (id, boutique_id, name, selection_style 'list'|'swatch', sort_order,
                         unique (boutique_id, lower(name)))
tr_variant_type_values  (id, type_id, label, hex null, image_url null, sort_order,
                         unique (type_id, lower(label)))
tr_product_options      (product_id, type_id, sort_order, primary key (product_id, type_id))
tr_product_variants     (id, product_id, option_value_ids uuid[],   -- ordered like the options
                         sku, barcode, price_kurus null, compare_at_price_kurus null,
                         stock int not null default 0, images jsonb, active bool, sort_order,
                         unique (product_id, option_value_ids))
tr_order_items          + variant_id uuid null, variant_label text null   -- snapshot at purchase
```

- Fashion boutiques are **seeded** with two types from what they already keep: `tr_boutiques.size_presets` → **Beden** (list) and `color_presets` → **Renk** (swatch, with the stored hex). Nothing is lost; the panel's existing chips and the new types describe the same values.
- Variants are public-readable like their product (price, stock). Per-variant cost stays in the private table.
- `tr_products.stock` stays as the **sum** of active variant stock, so lists, the feed and "sold out" status keep working.

### 8.4 What changes downstream (the real cost)

| Area | Today | With variants |
|---|---|---|
| Cart (local store) | line key = (productId, size) | (productId, variantId or size); legacy size lines keep working |
| Checkout (`checkoutValidate.ts`) | validates size against `sizes`, prices from the product | validates variantId, prices from the variant (falls back to the product price), still re-quotes server-side |
| Inventory (`commerce/inventory.ts`) | per-size map on the product | conditional decrement on the variant row, product stock recomputed; the "keep selling" flag applies |
| Order items | `size` text | + `variant_id`, `variant_label`; order, email and panel screens show the label |
| Product page | size picker | one selector per option: chips for *Liste*, swatches for *Renk / Görsel*; unavailable combinations disabled; price, stock and images follow the chosen variant |
| Google feed | one item per product | one item per variant with `item_group_id` (+ color/size where the type is Renk/Beden) |
| Panel Stok page | per-size table | rows per variant |

About 25 storefront/checkout files touch `size` today, so this is its own milestone (M7c), started only once a real Gelişmiş product exists. Checkout is currently limited to quantity 1 per line ("adet şu an 1 ile sınırlı"); variants don't change that.

### 8.5 Fashion and custom_art: coexist first (recommended)

Fashion keeps its size-with-stock model and its color-group linking (separate products per color, with their own packshots) **unchanged**. `custom_art` also reuses sizes ("boyut") and colors ("stil") as its options. Gelişmiş is a *separate* mechanism at first, and the storefront supports both (a cart line has either a legacy size or a variant id). Moving fashion's sizes onto a **Beden** variant type later is mechanical but touches the wizard, size charts and the size picker; it is a separate, optional project to decide once Gelişmiş is proven. It is **not** part of this plan.

## 9. Build order (each milestone is testable in the panel)

| # | Milestone | Contents | SQL |
|---|---|---|---|
| M1 | Types + Basit v1 | registry, chooser, dispatcher, route patterns; Basit editor with Temel bilgi, Medya (images), Stok, Lokasyon; private table for cost | patch 1: `product_type` + backfill, new columns, `tr_product_private` |
| M2 | SEO | slug module, `TrPanelSeoCard`, product slug routing, redirects, metadata, sitemap/noindex | patch 2: `slug`, `seo`, `tr_slug_redirects` |
| M3 | Categories | tables, seed/backfill, Tanımlamalar + Kategoriler pages, category picker in the product editor, storefront switch, bulk action | patch 3 |
| M4 | Detay + Envanter | Marka/Etiket/Google kategorisi/Tedarikçi, rich text (editor + sanitizer + product page section), SKU/barkod/desi/HS kodu, continue-selling wiring, feed fields | patch 4 (if not folded into 1) |
| M5 | Fashion re-home | moda chooser, `tek-parca` route for today's wizard, nav/route patterns | – |
| M6 | Media v2 | video + HEIC (client-side HEIC conversion; direct-to-storage upload for video because of request-size limits) | storage policy |
| M7a | Drawer + Varyant Türleri | `TrPanelDrawer`, Tanımlamalar card + Varyant Türleri page, seed Beden/Renk from the boutique presets | `tr_variant_types`, `tr_variant_type_values` |
| M7b | Gelişmiş editor | Varyant card (Varyant Ekle drawer, combinations table, toplu düzenle); zero variants behaves like Basit | `tr_product_options`, `tr_product_variants` |
| M7c | Variants in the shop | cart, checkout, inventory, order items, product-page selectors, feed, Stok page | `tr_order_items.variant_id` / `variant_label` |

Every milestone: unit tests for the pure logic (registry per profile, route patterns, slug/redirect rules, category tree rules, payload building), `tsc` + lint + build, lilabutik regression check (product URLs, prices, checkout unchanged), and an update to `agent-handoffs/05-owner-panel-commerce.md`.

## 10. Risks

- **Storefront regressions** are the main danger (category switch in M3, slug routing in M2). Mitigation: null-slug and code-tree fallbacks; switch behind parity checks on lilabutik.
- **HTML rendering** needs a real sanitizer on write and render (XSS otherwise).
- **HEIC and video** are not supported by the current upload path; HEIC decoding is not in sharp's prebuilt binaries, so it is done in the browser.
- **Dijital** is stored-only: such a product still goes through normal checkout and shipping until delivery exists.
- **Concurrent work:** another agent owns the panel home/dashboard; `panelNav.ts` and the shell are shared files.

## 11. Defaults I chose (change any of these)

1. Marka / Etiket / Google kategorisi / Tedarikçi are free-text creatable fields now, promoted to Tanımlamalar lists later.
2. Basit/Gelişmiş use explicit Kaydet; the fashion editor keeps autosave.
3. Existing products keep a null slug so lilabutik's indexed URLs don't change.
4. Lokasyon's "Ana adres" reads `shipping_address`, falling back to `physical_address`.
5. Flat category slugs (`/kategori/<slug>`), storefront menu shows two levels.
6. Ürünler list's Filtre and search stay as built in `059c175`; a "Tür" column is not added (only one category type).

## 12. Still open

- **Variant defaults to confirm:** max 3 option types and 100 variants per product; a variant's price is optional and inherits the product price; fashion and custom_art coexist with Gelişmiş for now (§8.5).
- Category picker details if they differ from §5 (the `⋯` menu items were only inferred from the "Ana Kategori" badge).
