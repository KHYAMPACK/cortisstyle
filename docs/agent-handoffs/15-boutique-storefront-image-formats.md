# 15 — Boutique storefront image formats

**Status:** **live.** Boutique customer-facing packshots are the same **marketplace PNG** Cadde uses. Do not generate a sibling flattened storefront WebP. Originals and on-model shots stay **WebP q95** (long edge ≤ 2400). Do not JPEG/WebP marketplace PNGs in place.

**Decision:** One packshot file (PNG). Boutique PLP/PDP and Cadde both show `marketplace_images`. Opaque photos (hanger originals, lifestyle/model shots) are high-quality WebP — much smaller than PNG, visually lossless at q95. Catalog backdrop is CSS behind the PNG on the card, not baked into a second file.

There is no separate “publish to storefront” upload. Format is chosen **when the file is written**.

## What exists today

| Kind | Column / path | What it is | Format |
|------|----------------|------------|--------|
| Original | `tr_products.images` → `tr-assets/…/original/` | Phone / hanger / room shot | **WebP q95** on upload (long edge ≤ 2400). Client JPEG-compresses files &gt; 1MB first (`prepareOwnerUploadFile`). |
| Marketplace | `marketplace_images` → `…/marketplace/` | FASHN packshot → Photoroom **transparent** cutout | **PNG** — live boutique + Cadde packshot |
| Storefront | `storefront_images` → `…/storefront/` | Leftover flattened copies from the old bake-on-save path | Unused for display. Column + helpers remain so old rows do not break. Do not write new files. |
| Lifestyle | `lifestyle_images` → `…/lifestyle/` | On-model / try-on | **WebP q95** on rehost (long edge ≤ 2400) |

Schema: `supabase/patch_tr_product_storefront_images.sql` still applies so the leftover column exists. Code omits the column if missing.

Packshot: `src/lib/tr/fashn/packshot.ts` keeps alpha PNG. Flatten helpers (`src/lib/tr/assets/flattenCutoutToStorefront.ts`, `buildStorefrontImageUrls`) are **not** called on product create/update. Boutique gallery: `getStorefrontGalleryImages` / `getProductCoverImageFor("boutique")` use `preferStorefront: false` so the PNG wins. Cadde `/tr/parca` uses `getMarketplaceGalleryImages` (PNG + lifestyle). Google Merchant uses boutique cover (PNG).

Photoroom **intermediate** stays PNG. JPEG cannot hold transparency.

### Panel display

Owner-panel **list/stock thumbs** use `getPanelProductCover` (marketplace PNG) via `next/image` (~80–96px). Wizard / store-preview thumbs also go through the optimizer; keep `unoptimized` on the product **lightbox** so the owner can inspect the exact PNG. Catalog-backdrop picker still stores `catalogBackgroundId` for panel preview CSS; it does not bake a live storefront file.

Panel chrome logos prefer SVG via `panelBoutiqueLogoSrc` (`src/lib/tr/panel/panelLogo.ts`).

## What not to do

- Do not flatten packshots onto the opaque 2:3 canvas for **Cadde** (already avoided in `packshot.ts`).
- Do not convert marketplace PNGs at PDP render time.
- Do not write a sibling storefront WebP “for the boutique site” — boutique customers see the PNG on the paper/beige card background.
- Do not bulk-delete or backfill `storefront_images`. Existing WebP rows stay unused.
- Do not apply the old 1600px storefront cap to originals or lifestyle (`ORIGINAL_MAX_EDGE_PX` is 2400).
- Do not change Cadde intro assets here — those are separate JPEGs under `public/images/tr/intro/`.

## Related

- Pipeline UI / credits: [06-sell-enablement.md](./06-sell-enablement.md)
- Storefront gallery helpers: `src/lib/tr/catalog/productImages.ts`
- Upload route: `src/app/api/tr/owner/upload/route.ts`
- Opaque encode: `src/lib/tr/assets/encodeOpaqueImage.ts` (`OPAQUE_WEBP_QUALITY` 95)
