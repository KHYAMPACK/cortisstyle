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
| Gelişmiş | = Basit + a **Varyant** card. Variant UI screenshots come later (it shares a component with a later feature) |
| Categories | Multiple per product, one **primary** ("Ana Kategori"). **Unlimited depth.** Normal categories only — **no dynamic (rule-based) categories** |
| Where categories live | Ürünler → **Tanımlamalar** hub. The hub shows **only Kategoriler** for now; the other ikas cards (Markalar, Etiketler, Özel Alanlar, Varyant Türleri, Ürün Grupları, Tedarikçiler, Ürün Kişiselleştirmeleri, Ürün Birimleri, Sepet Linki) are added when something needs them |
| Assigning categories | From the product editor (create and edit) and as a bulk action in the Ürünler list |
| Stored-only optional fields | Ürün türü **Dijital**, **HS kodu**, **Tedarikçi**, **Lokasyon**. Created as in ikas, optional, saved, *not* wired into checkout / shipping / purchasing |
| Lokasyon | Shows the boutique's own address as **"Ana adres"**, read-only |
| Stok | Its **own section**, separate from Lokasyon (ikas merges them) |
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

- `sort_criterion` values seen in ikas: `best_selling`, `discount_desc`, `discount_asc`, `price_desc`, `price_asc`, `newest` (list scrolls; **confirm whether more exist**, likely `oldest`). "En çok satanlar" needs sales counts from `tr_order_items` (grouped query, cached).
- **`tr_products.category` stays** as a copy of the primary category's slug, written in one place, so filters, the feed and the ~14 storefront files keep working during the switch.
- **Rules:** unlimited depth, no cycles (server check), deleting a category moves its children up one level and unassigns products; if a product's primary is removed, the next category becomes primary (or none).
- **Seed and backfill (SQL patch):** every boutique with `catalog_profile = 'fashion'` gets the current code tree as its categories (slug = existing id, so `elbise`, `pantolon`… match), and every product with a `category` gets one primary row. Style variants (`kase-kaban`, `kot-pantolon`, …) are seeded too and marked hidden from the menu so old products keep matching.
- **Storefront switch:** menu and category pages read `tr_categories`; until a boutique has rows, the code tree is the fallback. The menu shows two levels; deeper categories are reached via category pages and breadcrumbs (menu design for deep trees is out of scope).

**Panel**

- `Tanımlamalar` nav child under Ürünler → `/tr/panel/tanimlamalar` (hub, one card: Kategoriler).
- `/tr/panel/tanimlamalar/kategoriler`: search + Filtre, tree list (Ad, Sıralama ölçütü, ürün sayısı), "Kategori ekle". No Normal/Dinamik tabs.
- `/kategoriler/yeni` and `/kategoriler/[id]`: editor with Temel bilgi (ad, ebeveyn, açıklama, görsel), Ürünler (sıralama ölçütü), SEO.
- Ürünler list bulk bar: "Kategori ekle" (adds; sets primary only when the product has none).

## 8. Gelişmiş ürün (variants) — deferred

= Basit + **Varyant** card. Price, SKU, barcode, stock (and images) become per-variant rows. This is the largest foundation: cart lines, checkout re-pricing, stock decrement and `tr_order_items` know only `size` today, and fashion's size-and-stock model is effectively a one-option variant system. **No design until Mert sends the variant UI**; then decide whether fashion migrates onto the new variant model (not now).

## 9. Build order (each milestone is testable in the panel)

| # | Milestone | Contents | SQL |
|---|---|---|---|
| M1 | Types + Basit v1 | registry, chooser, dispatcher, route patterns; Basit editor with Temel bilgi, Medya (images), Stok, Lokasyon; private table for cost | patch 1: `product_type` + backfill, new columns, `tr_product_private` |
| M2 | SEO | slug module, `TrPanelSeoCard`, product slug routing, redirects, metadata, sitemap/noindex | patch 2: `slug`, `seo`, `tr_slug_redirects` |
| M3 | Categories | tables, seed/backfill, Tanımlamalar + Kategoriler pages, category picker in the product editor, storefront switch, bulk action | patch 3 |
| M4 | Detay + Envanter | Marka/Etiket/Google kategorisi/Tedarikçi, rich text (editor + sanitizer + product page section), SKU/barkod/desi/HS kodu, continue-selling wiring, feed fields | patch 4 (if not folded into 1) |
| M5 | Fashion re-home | moda chooser, `tek-parca` route for today's wizard, nav/route patterns | – |
| M6 | Media v2 | video + HEIC (client-side HEIC conversion; direct-to-storage upload for video because of request-size limits) | storage policy |
| M7 | Gelişmiş | variants, after screenshots | TBD |

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

- The full **Sıralama ölçütü** list (is there anything below "Yeniden Eskiye"?).
- The **variant UI** (blocks M7).
- Category picker details if they differ from §5 (the `⋯` menu items were only inferred from the "Ana Kategori" badge).
