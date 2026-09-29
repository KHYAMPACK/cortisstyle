# Product upload foundation — product types, editor blocks, categories, SEO

_Prepared 2026-09-24 on branch `panel-products`. Facts below were checked against the repo and the live Supabase project (`qjxclaggqzhfaqihwdle`, read-only) the same day. This is a **plan**, not built yet. Inputs: Mert's ikas screenshots (Basit ürün, Kategoriler, Tanımlamalar) and his decisions in §1._

## Status

**M1 built on `panel-products` (not yet merged or deployed).** Deviations from the plan below, all deliberate:

- The **moda sub-chooser (part of M5) landed in M1**: `/urun/yeni` became the type chooser, so the existing wizard needed its new home (`/urun/yeni/moda/tek-parca`) and the chooser needed a fashion path in the same change. `/urun/takim` and `/urun/toplu` are unchanged.
- **Birim fiyat moved to M4** with the other product-page additions (it is only useful once the product page shows it).
- **Lokasyon's "Ana adres"** reads `physical_address` (the field Ayarlar → Adres edits), falling back to `shipping_address`.
- The Basit ürün has **no category card unless the boutique's `category_mode` is `custom`** (M3a; otherwise its category stays empty) and **requires at least one photo** (the storefront has not been checked with photo-less products).
- **Gelişmiş is not in the chooser** until its editor exists (no placeholders).
- **M2 (SEO) built on `panel-products`** (`supabase/patch_product_seo.sql`): the shared `TrPanelSeoCard`, product slugs with auto-generation for Basit ürün, old-slug redirects, canonical/noindex metadata, sitemap and Google feed. Deviations: the id URL is **not** redirected to the slug URL (both serve the page; the canonical link names the slug URL) — a redirect from inside the page would only be a client-side one because of the route's loading boundary, so real 308s wait for the Store URLs work; the storefront reads slug/SEO through separate tolerant queries instead of extending the public column lists (safe before the SQL, at the cost of an extra query for slugged products; extending the lists later is a possible follow-up).
- **M3a (categories, panel + backend + category pages) built on `panel-products`** (`supabase/patch_categories.sql`): `tr_categories` / `tr_product_categories`, the Tanımlamalar hub with the Kategoriler pages, `TrPanelCategoryPicker` in the Basit editor, the bulk "Kategori ekle" in the Ürünler list, `/tr/<slug>/kategori/<slug>` pages with slug redirects, category URLs in the sitemap. Deviations from §7, all deliberate:
  - **No seeding or backfill of the fashion tree.** A boutique has a `category_mode` (`legacy` = the built-in fashion code tree, the default for every existing boutique; `custom` = its own `tr_categories`). Nothing changes for lilabutik; a boutique is switched to `custom` explicitly (SQL for now, `update public.tr_boutiques set category_mode = 'custom' where slug = 'deneme-butik';`). The Basit editor shows its Kategori card only in `custom` mode.
  - **The storefront switch is split off as M3b** (menu, mega-menu, category drawer, PLP filters and labels, home category tiles for `custom` boutiques). It touches ~26 files on the live lilabutik code paths and needs a go/no-go. Until it lands, a `custom` boutique's navigation still shows the fashion tree and its PLP chips humanize slugs.
  - **A category's description is plain text** until the rich-text editor exists (M4); it is stored in `description_html` and rendered as text.
  - **The category page has its own layout** (breadcrumb, image, description, subcategory chips, product grid); it does not go through the fashion PLP.
- **Storefront freeze (Mert, 2026-09-25):** no storefront changes until the database and types are solid. That skips **M3b** and the storefront halves of M4 for now: the product page's Açıklama section and birim fiyat, the Google feed fields (brand, gtin/mpn, google category), the continue-selling behavior in checkout/inventory/availability, and carrier-label desi. Their columns and types exist; nothing reads them yet. **Lifted for M7c-1 only** (server-side variant selling, same day); M7c-2 and M7c-3 stay frozen.
- **M4 (Ürün detayı + Envanter, panel + database + types) built on `panel-products`** (`supabase/patch_product_details.sql`, needs `patch_product_types.sql` first): the Basit editor gained the Ürün detayı card (Marka, Etiket, Google ürün kategorisi, Tedarikçi, the category picker, rich-text Açıklama), Envanter (SKU, Barkod, Kargo desi, HS kodu), "Stoğu tükenince satmaya devam et" in Stok, and Birim fiyat in Temel bilgi. Marka / Etiket / Tedarikçi suggest what the boutique already uses (`/api/tr/owner/products/facets`). The plan's "no dormant code" rule is deliberately relaxed here, like the four stored-only fields: every field is saved and typed, and the cards say what is not consumed yet. Details: `TrProductDetails` in `types/tr-marketplace.ts`; rules in `lib/tr/productDetails.ts` (one function validates both the form and the API); rich text = Tiptap in the panel (`TrPanelRichTextField`) + `sanitize-html` on every write (`richTextSanitize.ts`); Tedarikçi and HS kodu live in `tr_product_private`. Deviations: **SKU is not unique** (variants in M7 will move SKU per variant, so uniqueness waits for them); a category's description stays plain text (the category editor has not adopted the rich-text field, and the category page still renders text); unit types are g, kg, ml, l, cm, m, m², adet with the price quoted per kg / l / m / m² / adet (`productUnits.ts`).
- **M7a (Varyant Türleri: panel + database + types) built on `panel-products`** (`supabase/patch_variant_types.sql`): the second card on the Tanımlamalar hub and `/tr/panel/tanimlamalar/varyant-turleri` (list with Ad, Seçim Stili, Varyantlar, Ürünler, search, empty state), editing in the shared drawer (`TrVariantTypeDrawer`, which the Gelişmiş product's "Yeni varyant türü" will reuse in M7b). A type has a name (unique per boutique, case-insensitive), a selection style (Liste or Renk / Görsel), and 1-100 ordered values; a swatch value needs a colour and/or a picture. Value ids stay stable across renames and reordering (variants will point at them). Nothing outside the panel reads these tables. Deviations: **seeding Beden / Renk is an explicit "İçe aktar" button** on the page (offered while the boutique has saved sizes / colours that are not yet a type of that name), not a SQL seed, so nothing appears in a live boutique's database unasked; the "in use" guard (a type or value used by a product can't be removed) and the real product count arrive with `tr_product_options` in M7b (the count reads 0 until then, and the code has a TODO where the guard goes).
- **M7b (Gelişmiş ürün: Varyant card, panel + database + types) built on `panel-products`** (`supabase/patch_product_variants.sql`, needs `patch_variant_types.sql` first): `/tr/panel/urun/yeni/gelismis` and `urun/[id]` open the same editor as Basit ürün (`TrSimpleProductEditor`) plus a **Varyant** card. Varyant Ekle opens a drawer (`TrVariantPickerDrawer`): tick up to 3 variant types, tick their values (a list type can get a new value on the spot, "Yeni varyant türü" opens the type drawer and returns), and Uygula generates every combination into a table (Varyant, Görsel, SKU, Barkod, Fiyat, Stok, Aktif). Applying a selection keeps the data of combinations that survive, adds new ones blank, and asks before dropping rows; changing the option types themselves starts fresh. **Toplu düzenle** sets price / stock / on-off for all rows or all rows of one value. Variants are part of the product form: they save with the product's Kaydet. With variants, the product-level Stok, SKU and Barkod are replaced by the table and `tr_products.stock` is the sum of the active variants' stock (recomputed on the server); with none, the product sells like a Basit ürün. A type or value that a product uses can no longer be deleted (the M7a TODOs are done) and the Varyant Türleri page now shows the real product count. Duplicating a Gelişmiş ürün copies options and variants (SKU and barcode stay empty). Deviations: **Gelişmiş ürün is offered to staff only in the type chooser** (`staffOnly` in `productTypes/registry.ts`) until the shop can sell variants (M7c), so a live owner can't create products a shopper can't choose variants for; it is reachable for everyone by URL and existing ones open normally. **A variant has one price and no discount of its own** (`price_kurus` null = inherits the product's price and its İndirimli fiyat; a value replaces both); per-variant compare-at and cost are not modeled yet. The variant tables are service-role only; a public read arrives with M7c. A variant is identified by its combination of value ids, not by a row id.
- **M7c-1 (variants can be sold: server side) built on `m7c-variant-orders`** (`supabase/patch_order_items_variant.sql`, needs `patch_product_variants.sql` first): `tr_order_items.variant_id` / `variant_label` (the label is the snapshot every screen shows). Checkout re-loads a Gelişmiş product's variants and requires the chosen `variantId` (`CheckoutClientItem.variantId`); the price is the variant's own or the product's, the variant must be active and in stock, and the line keeps `size` null. The rules are pure and tested (`variants/variantSale.ts`); stock is taken from the variant row with a compare-and-set on its stock and `tr_products.stock` is re-summed from the active variants, `available` ⇄ `sold` following it (`commerce/inventory.ts`, tested against an in-memory client). Cancel, failed/abandoned iyzico holds and re-payment give stock back or re-take it per variant through one helper (`commerce/inventoryLines.ts`); a line whose variant was deleted after the order has nothing to give back to. Order screens show "Varyant: Kırmızı / S" instead of "Beden" (`orderItemOption`): the panel order page, the CSV export, the shopper's order confirmation page and the invoice draft. Deviations: **no public read of the variant tables yet** (nothing on the storefront reads them until the selectors, M7c-2, so the RLS stays service-role only); only `advanced` products are checked for variants, so fashion checkout does no extra query; the shop's cart and product page **cannot choose a variant yet**, so a variant product still can't be bought by shoppers (it stays staff-only) — only the API accepts it; the quantity limit of 1 per line and the ignored `continue_selling_when_out_of_stock` flag are unchanged (stock is strict).
- **Shared components merged for other agents:** the editor layout, `TrPanelPopover`, `TrPanelChoiceCard`, the data table options, the save model pieces and `TrPanelDrawer` (M7a's drawer was pulled forward).

Apply `supabase/patch_product_types.sql` **before** trying Basit ürün on a real database. The app tolerates the patch being absent (products read as `fashion`, and the cost price save reports a clear error), but a Basit ürün created before the patch would lose its type.

## Store URLs (decided 2026-09-24, built after M2)

SEO is URL-heavy, so the addresses themselves need a structure. Today a store on a custom domain (lilabutik → `lilaboutiquedenizli.com`) is served at clean paths, but a store without one exists only at `www.cortisstyle.com/tr/<slug>`; the proxy resolves hosts by an exact-match map from `tr_boutiques.custom_domain` (2-minute cache), connecting a domain is a manual ops step (DNS + the column, no self-serve screen or verification), and a custom-domain host also answers at `/tr/<slug>/…` (duplicate addresses). The direction:

- **Every store gets a default subdomain** `<slug>.<stores-domain>` (wildcard DNS and certificate; the proxy resolves it like a custom domain; unknown subdomains 404). Mert prefers a **separate stores domain** (recommended over a subdomain of `cortisstyle.com`: cookies, email reputation and SEO authority stay apart from the panel and brand site). **The domain itself is undecided.**
- **One canonical host per store:** the custom domain if connected, otherwise the subdomain. Other variants (`/tr/<slug>/…`, the subdomain once a custom domain exists, www vs apex) permanently redirect to it; canonical tags, sitemap and the Google feed name that host.
- **Clean paths on every store host:** `/urun/<slug>`, `/kategori/<slug>`, `/urunler`. `/tr/<slug>/…` stays internal; only the panel keeps a public `/tr/` prefix.
- **Custom-domain connection stays ops-managed** until there are enough stores to justify a self-serve flow (owner enters the domain, we show DNS records and verify via the hosting provider's API).
- **Order:** after M2 (Mert's call). M2 is written against one helper for "the store's public address" (`src/lib/tr/seo/storeAddress.ts`) so this work only changes that helper and the proxy. Touching `lilaboutiquedenizli.com` (redirecting its `/tr/lilabutik/…` duplicates, www/apex) needs Mert's explicit go-ahead.
- **Scoped as its own milestone (2026-09-29): wildcard subdomain + canonical redirects + clean paths only** — no self-serve "connect your domain" panel page or buy-a-domain flow yet (that stays a later, separate piece; custom-domain connection stays exactly as ops-managed as today). Not touching `lilaboutiquedenizli.com` itself — it keeps working unchanged; it only becomes reachable by an additional redirect-target subdomain, like every other boutique.
- **Not one helper yet, in practice — three.** `storeAddress.ts` (explicit `customDomain` input; product/category metadata, the SEO card) is one of *three* independent "custom domain or platform" implementations: `storefrontSeo.ts` (request-header-based; sitemap.xml, robots.txt) and `resolveMerchantStoreOrigin` inside `googleMerchant/feed.ts` are the other two, both untested. Consolidating all three into `storeAddress.ts` is part of this milestone, not a pre-existing given.
- **Stores domain: build against an env var (`TR_STORES_DOMAIN`), no literal domain hardcoded anywhere in source** (only illustrative in comments/tests). Mert will pick/buy the real domain separately; nothing in the code depends on that happening first — the feature is inert wherever the env var is unset.
- **Sitemap: drop cross-listing, matching ikas exactly (verified live 2026-09-29, not assumed).** `ikas.com` is purely the SaaS marketing site — its own sitemap/robots only reference its own marketing pages, nothing about merchant stores. A live free-tier store still on its default subdomain (`cantique.ikas.shop`; `myikas.com` now 301s to `.ikas.shop`) serves a fully self-contained sitemap index (`pages.xml`, `products.xml`) on its own host, with zero cross-references to other stores or to `ikas.com`. So: once a boutique has a canonical subdomain or custom domain, its pages come **out of the platform sitemap entirely** — it's only ever discoverable from its own host's sitemap, the way a custom-domain boutique already works today (`ctx.kind === "boutique"` in `storefrontSeo.ts`); that branch just needs to also fire for subdomains.
- **Build order (pure logic first):** (1) subdomain parsing + the canonical-redirect decision + the three-way consolidation into `storeAddress.ts`, all pure and unit-tested, no proxy/route wiring — inert until wired in, so it doesn't need the storefront freeze lifted; (2) wire `proxy.ts` (resolve subdomain hosts without a DB hit, keep the existing custom-domain DB path, add the redirect step before the rewrite step — `rewriteBoutiqueDomainPath` itself is unchanged); (3) switch `sitemap.ts` / `robots.ts` / `feed.ts` to the consolidated helper and drop cross-listing; (4) local dry run via env overrides before any real DNS exists; (5) ops (Mert): buy/point the stores domain, wildcard `*.<stores-domain>` + DNS on the Vercel project, wait for the cert; (6) set the env var in production — the only actually live-risk step. Steps 2–3 touch frozen storefront files (`proxy.ts`, `sitemap.ts`, `robots.ts`, the feed) and need the freeze explicitly lifted for this milestone first, same as M7c-1. **Not started as of 2026-09-29** — plan only, by Mert's choice.

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
| `TrPanelConfirmPopover` | done | small yes/no over a button; the unsaved-changes prompt in drawers |
| `TrPanelEditorSave` + `useUnsavedChangesGuard` | done | the shared Kaydet / status / Ctrl+S cluster and the exit guard (§4 save model below) |
| `TrPanelDrawer` (**done**) | Varyant türü oluştur/düzenle, inline "yeni marka/etiket/kategori/…" from any editor, later Özel Alan, Ürün Birimi | right-side slide-over: title + close, scrolling body, sticky footer with Vazgeç / Kaydet. Dims the page, closes on Esc and backdrop click, traps focus, returns focus to the trigger, asks before discarding edits. Full-screen on phones. Stacks above the editor top bar and below the leave-guard dialog |

**Save model (decided 2026-09-24, panel-wide).** Forms save manually with a confirmation on exit; actions apply immediately; inline table edits use a pending-changes bar. No autosave in anything new; the fashion editor keeps its autosave until its migration is planned. Full rules in `agent-handoffs/05-owner-panel-commerce.md` ("Saving"). Reason it matters here: a slug edit must not autosave on every keystroke and create redirects. Costly AI output on standard products (future): generated text lands in the field as an unsaved edit; paid media is stored when generated and attaches to the product on Kaydet.

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
- **No seed or backfill (changed in M3a):** rather than copying the fashion code tree into `tr_categories`, each boutique has `category_mode` (`legacy` | `custom`). `legacy` boutiques keep the code tree and `tr_products.category` as today; `custom` boutiques use only their own rows. Moving fashion onto real categories is part of the later fashion migration.
- **Storefront switch (M3b):** menu and category pages read `tr_categories` for `custom` boutiques; `legacy` boutiques keep the code tree. The menu shows two levels; deeper categories are reached via category pages and breadcrumbs (menu design for deep trees is out of scope). M3a already serves `/kategori/<slug>` pages for `custom` boutiques.

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
| M3a | Categories (panel + pages) | tables + `category_mode`, Tanımlamalar + Kategoriler pages, category picker in the product editor, bulk action, category pages, sitemap | patch 3 (`patch_categories.sql`) |
| M3b | Categories in the storefront | menu, mega-menu, category drawer, PLP filters/labels, home tiles read `tr_categories` for `custom` boutiques. **Paused** with the storefront freeze | – |
| M4 | Detay + Envanter | **Built (panel + DB + types):** Marka/Etiket/Google kategorisi/Tedarikçi, rich text (editor + sanitizer), SKU/barkod/desi/HS kodu, birim fiyat, continue-selling flag. **Waits for the storefront pass:** product page Açıklama and birim fiyat, feed fields, continue-selling wiring, carrier desi | patch 4 (`patch_product_details.sql`) |
| M5 | Fashion re-home | moda chooser, `tek-parca` route for today's wizard, nav/route patterns | – |
| M6 | Media v2 | video + HEIC (client-side HEIC conversion; direct-to-storage upload for video because of request-size limits) | storage policy |
| M7a | Drawer + Varyant Türleri | **Built:** `TrPanelDrawer`, Tanımlamalar card + Varyant Türleri page, `TrVariantTypeDrawer`, İçe aktar for Beden/Renk from the boutique presets | `tr_variant_types`, `tr_variant_type_values` (`patch_variant_types.sql`) |
| M7b | Gelişmiş editor | **Built:** Varyant card (Varyant Ekle drawer, combinations table, toplu düzenle); zero variants behaves like Basit; staff-only in the chooser until M7c | `tr_product_options`, `tr_product_variants` |
| M7c-1 | Variants in orders (server) | **Built:** order items keep the variant, checkout validation and price, per-variant inventory take/restore, variant labels on order screens | `tr_order_items.variant_id` / `variant_label` (`patch_order_items_variant.sql`) |
| M7c-2 | Variants in the shop (UI) | product-page selectors, cart lines keyed by product + variant, public read of variants. **Paused** with the storefront freeze | public read policy |
| M7c-3 | Feed + Stok | Google feed item per variant, Stok page rows per variant. **Paused** | – |

Every milestone: unit tests for the pure logic (registry per profile, route patterns, slug/redirect rules, category tree rules, payload building), `tsc` + lint + build, lilabutik regression check (product URLs, prices, checkout unchanged), and an update to `agent-handoffs/05-owner-panel-commerce.md`.

## 10. Risks

- **Storefront regressions** are the main danger (category switch in M3b, slug routing in M2). Mitigation: null-slug and code-tree fallbacks; switch behind parity checks on lilabutik.
- **HTML rendering** needs a real sanitizer on write and render (XSS otherwise).
- **HEIC and video** are not supported by the current upload path; HEIC decoding is not in sharp's prebuilt binaries, so it is done in the browser.
- **Dijital** is stored-only: such a product still goes through normal checkout and shipping until delivery exists.
- **Concurrent work:** another agent owns the panel home/dashboard; `panelNav.ts` and the shell are shared files.

## 11. Defaults I chose (change any of these)

1. Marka / Etiket / Google kategorisi / Tedarikçi are free-text creatable fields now, promoted to Tanımlamalar lists later.
2. Basit/Gelişmiş use explicit Kaydet; the fashion editor keeps autosave.
3. Existing products keep a null slug so lilabutik's indexed URLs don't change.
4. Lokasyon's "Ana adres" reads `physical_address` (what Ayarlar edits), falling back to `shipping_address`.
5. Flat category slugs (`/kategori/<slug>`), storefront menu shows two levels. A category description is plain text until rich text lands (M4).
6. Ürünler list's Filtre and search stay as built in `059c175`; a "Tür" column is not added (only one category type).

## 12. Still open

- **Variant defaults, as built in M7b (say if any should change):** max 3 option types and 100 variants per product; a variant's price is optional and inherits the product price; fashion and custom_art coexist with Gelişmiş for now (§8.5); a variant has no compare-at price or cost of its own yet.
- Category picker details if they differ from §5 (the `⋯` menu items were only inferred from the "Ana Kategori" badge).
