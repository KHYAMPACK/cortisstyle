# 15 — Boutique storefront image formats (later)

**Status:** storage transcode is **plan only** — do not JPEG/WebP packshots in place. Panel **display** thumbs via `next/image` are live (see below). Cadde packshot cutouts stay **PNG** in storage.

**Decision:** Boutique **customer-facing photos with a real background** should be JPEG or WebP. **Transparent packshot cutouts** stay PNG (panel pipeline + Cadde).

There is no separate “publish to storefront” upload. Panel and storefront point at the **same storage URLs**. Format is chosen **when the file is written**.

## What exists today

Owner upload (`POST /api/tr/owner/upload` + guided wizard):

| Kind | Column / path | What it is | Format today |
|------|----------------|------------|----------------|
| Original | `tr_products.images` → `tr-assets/…/original/` | Phone / hanger / room shot (has background) | As uploaded (PNG unless file &gt; ~3.5MB → JPEG in `prepareOwnerUploadFile`) |
| Marketplace | `marketplace_images` → `…/marketplace/` | FASHN packshot → Photoroom **transparent** cutout | **PNG** (`output_format: "png"`, `contentType: "image/png"`) |
| Lifestyle | `lifestyle_images` → `…/lifestyle/` | On-model / try-on (person + background) | Whatever FASHN returns (often PNG) via `rehostRemoteImageToTrAssets` |

Packshot code: `src/lib/tr/fashn/packshot.ts` (keep alpha — do not flatten to the opaque normalize canvas).  
On-model: `src/lib/tr/aiModel/generate.ts` → rehost `kind: "lifestyle"`.  
Storefront gallery: `getStorefrontGalleryImages` prefers cutouts + lifestyle.

Photoroom **intermediate** must stay PNG (or WebP **with alpha**). JPEG cannot hold transparency.

### Panel display (done — not a storage rewrite)

Owner-panel **list/chrome thumbs** use `next/image` (optimizer WebP/AVIF at ~80–96px). Drop `unoptimized` on product list, stock, order thumbs, success cover, packing cells. Keep `unoptimized` on editor / wizard / lightbox / store preview so the owner sees the exact file.

Do **not** convert stored marketplace packshot PNGs. The optimizer serves a derived thumb; `tr-assets` packshots stay PNG.

Panel chrome logos prefer SVG via `panelBoutiqueLogoSrc` (`src/lib/tr/panel/panelLogo.ts`) — e.g. `public/tr/boutiques/pervinsoysalbutik/logo.svg`. SVG skips the Next optimizer (`TrPanelBoutiqueLogo`). Storefront `logoUrl` overrides can stay PNG.

## Target (when implementing storage writes)

| File | Keep PNG? | Store as | Why |
|------|-----------|----------|-----|
| Packshot cutout (`marketplace`) | **Yes** | PNG | Alpha. Input to on-model. Cadde catalog. |
| Photoroom temp buffer | **Yes** | PNG | Alpha only. |
| Original owner photo | No | WebP (~80) or JPEG (~85), long edge ≤ 2400px | Background photo; boutique storefront |
| On-model / lifestyle | No | WebP or JPEG, same caps | Background photo; boutique PDP / hover |

Prefer **WebP** for new boutique writes (smaller than JPEG, same look). JPEG is fine if WebP encode is awkward in a given path.

**Do not** JPEG the marketplace PNG “for the boutique site.” The boutique gallery **reuses that PNG** for packshot slots. Converting it drops alpha and breaks later on-model + Cadde.

## Implementation sketch (later)

1. **Originals** — after `prepareOwnerUploadFile` (or in the upload route), transcode `kind: "original"` to WebP/JPEG. Leave `removeBackground` / packshot path on PNG.
2. **Lifestyle rehost** — in `rehostRemoteImageToTrAssets` (or the try-on caller), when `kind === "lifestyle"`, sharp-encode WebP/JPEG before `uploadTrProductAsset`. Do not transcode `kind: "marketplace"`.
3. **Do not change** `generateFashnPackshot` PNG upload or Photoroom `format: png`.
4. **Existing products** — optional backfill script; not required for the first PR. New uploads only is enough.
5. **Panel thumbs** — already via `next/image` WebP; do not JPEG packshots “for the panel.” If the optimizer path fails (private URLs), a derived `panel-thumb.webp` (~320px) could be generated as a **new** file, not a replacement.

## What not to do

- Do not flatten packshots onto the opaque 2:3 canvas for Cadde (that path is already avoided in packshot.ts).
- Do not convert marketplace PNGs at PDP render time (CPU + cache mess).
- Do not change Cadde intro assets here — those are separate JPEGs under `public/images/tr/intro/`.

## Related

- Pipeline UI / credits: [06-sell-enablement.md](./06-sell-enablement.md)
- Storefront gallery helpers: `src/lib/tr/catalog/productImages.ts`
- Upload route: `src/app/api/tr/owner/upload/route.ts`
