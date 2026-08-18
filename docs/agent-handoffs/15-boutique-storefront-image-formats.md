# 15 — Boutique storefront image formats

**Status:** **live.** Boutique customer-facing packshots are opaque **WebP** copies. Cadde packshot cutouts stay **PNG** in `marketplace_images`. Do not JPEG/WebP those PNGs in place.

**Decision:** Boutique **photos with a real background** are WebP (JPEG fallback). **Transparent packshot cutouts** stay PNG (panel pipeline, Cadde, try-on input). Background is **baked into the boutique WebP** at save time from `catalogBackgroundId`. Changing the backdrop regenerates **only** the WebP.

There is no separate “publish to storefront” upload. Format is chosen **when the file is written**.

## What exists today

| Kind | Column / path | What it is | Format |
|------|----------------|------------|--------|
| Original | `tr_products.images` → `tr-assets/…/original/` | Phone / hanger / room shot | **WebP** on upload (long edge ≤ 2400). Client JPEG-compresses files &gt; 1MB first (`prepareOwnerUploadFile`). |
| Marketplace | `marketplace_images` → `…/marketplace/` | FASHN packshot → Photoroom **transparent** cutout | **PNG** |
| Storefront | `storefront_images` → `…/storefront/` | Same garment, flattened onto catalog background | **WebP** q80, long edge ≤ 1600 |
| Lifestyle | `lifestyle_images` → `…/lifestyle/` | On-model / try-on | **WebP** on rehost |

Schema: `supabase/patch_tr_product_storefront_images.sql`. Apply on prod; code omits the column if missing and boutique falls back to PNG.

Packshot: `src/lib/tr/fashn/packshot.ts` keeps alpha PNG. Flatten: `src/lib/tr/assets/flattenCutoutToStorefront.ts` on product create/update when marketplace URLs or `catalogBackgroundId` change (or storefront copies are missing). Same `fileId` upsert so a backdrop change overwrites the WebP.

Storefront gallery: `getStorefrontGalleryImages` prefers `storefrontImages[i]`, then PNG, then extra originals, then lifestyle. Cadde `/tr/parca` uses `getMarketplaceGalleryImages` (PNG + lifestyle). Google Merchant uses boutique storefront covers.

Photoroom **intermediate** stays PNG. JPEG cannot hold transparency.

### Panel display

Owner-panel **list/stock thumbs** use `getPanelProductCover` (storefront WebP when present) via `next/image` (~80–96px). Wizard / store-preview thumbs also go through the optimizer; keep `unoptimized` on the product **lightbox** so the owner can inspect the exact PNG.

Panel chrome logos prefer SVG via `panelBoutiqueLogoSrc` (`src/lib/tr/panel/panelLogo.ts`).

## What not to do

- Do not flatten packshots onto the opaque 2:3 canvas for **Cadde** (already avoided in `packshot.ts`).
- Do not convert marketplace PNGs at PDP render time.
- Do not JPEG marketplace PNGs “for the boutique site” — write a **sibling** storefront WebP instead.
- Existing products get storefront WebP on the **next save** that includes photos or catalog background (no bulk backfill script).
- Do not change Cadde intro assets here — those are separate JPEGs under `public/images/tr/intro/`.

## Related

- Pipeline UI / credits: [06-sell-enablement.md](./06-sell-enablement.md)
- Storefront gallery helpers: `src/lib/tr/catalog/productImages.ts`
- Upload route: `src/app/api/tr/owner/upload/route.ts`
