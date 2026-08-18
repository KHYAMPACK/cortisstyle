import { isLookbookPieceImage } from "@/data/tr/lookbookPieceImages";
import { TR_OWNER_PRODUCT_LIMITS } from "@/lib/tr/ownerProductConstraints";
import { isTrMarketplaceAssetUrl } from "@/lib/tr/trAssetUrls";
import type { TrProduct } from "@/types/tr-marketplace";

export type TrProductImageSurface = "boutique" | "marketplace";

type CatalogImageProduct = Pick<TrProduct, "images" | "marketplaceImages"> &
  Partial<Pick<TrProduct, "storefrontImages" | "lifestyleImages">>;

function nonEmpty(urls: string[] | undefined): string[] {
  return (urls ?? []).filter((url) => Boolean(url?.trim()));
}

/** Original boutique gallery (owner uploads). */
export function getBoutiqueProductImages(
  product: Pick<TrProduct, "images">,
): string[] {
  return nonEmpty(product.images);
}

/**
 * Per-index resolve for catalog surfaces.
 * When any marketplace cutout exists, never fall back to raw boutique uploads
 * (those are hanger / room shots and must stay owner-only).
 */
export function resolveProductImagesPerIndex(
  product: Pick<TrProduct, "images" | "marketplaceImages">,
): string[] {
  const cutouts = nonEmpty(product.marketplaceImages);
  if (cutouts.length > 0) return cutouts;
  return getBoutiqueProductImages(product);
}

/**
 * Marketplace / catalog cutouts with per-index fallback to boutique originals.
 * Cadde and try-on must keep these transparent PNGs.
 */
export function getMarketplaceProductImages(
  product: Pick<TrProduct, "images" | "marketplaceImages">,
): string[] {
  const resolved = resolveProductImagesPerIndex(product);
  if (resolved.length > 0) return resolved;
  return getBoutiqueProductImages(product);
}

function galleryFromSlots(params: {
  product: CatalogImageProduct;
  preferStorefront: boolean;
}): string[] {
  const boutique = params.product.images ?? [];
  const market = params.product.marketplaceImages ?? [];
  const storefront = params.product.storefrontImages ?? [];
  const lifestyle = nonEmpty(params.product.lifestyleImages);
  const hasAnyCutout = market.some((url) => Boolean(url?.trim()));
  const cutoutSlots = TR_OWNER_PRODUCT_LIMITS.cutoutPhotoSlots;
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (url: string | undefined) => {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    out.push(trimmed);
  };

  const slotCount = Math.max(boutique.length, market.length, storefront.length);
  for (let i = 0; i < slotCount; i += 1) {
    const baked = params.preferStorefront ? storefront[i]?.trim() : "";
    const cutout = market[i]?.trim();
    const original = boutique[i]?.trim();
    if (baked) {
      push(baked);
      continue;
    }
    if (cutout) {
      push(cutout);
      continue;
    }
    if (!original) continue;
    // No cutouts at all → show boutique gallery as-is.
    // With cutouts → never re-surface raw front/back hanger shots.
    if (!hasAnyCutout || i >= cutoutSlots) {
      push(original);
    }
  }

  for (const url of lifestyle) push(url);

  return out;
}

export function getProductCoverImageFor(
  surface: TrProductImageSurface,
  product: CatalogImageProduct,
): string | null {
  if (surface === "boutique") {
    const storefront = galleryFromSlots({
      product,
      preferStorefront: true,
    });
    if (storefront.length > 0) return storefront[0] ?? null;
    return getBoutiqueProductImages(product)[0] ?? null;
  }

  const marketplace = getMarketplaceProductImages(product);
  if (marketplace.length > 0) return marketplace[0] ?? null;
  return null;
}

export function hasRealMarketplaceImagery(
  product: Pick<TrProduct, "images" | "marketplaceImages">,
): boolean {
  if (nonEmpty(product.marketplaceImages).length > 0) return true;
  return nonEmpty(product.images).some(
    (url) => isTrMarketplaceAssetUrl(url) || isLookbookPieceImage(url),
  );
}

/**
 * Boutique PDP / PLP / Merchant: prefer flattened storefront WebP, then PNG
 * cutouts, then unused extra originals, then lifestyle.
 */
export function getStorefrontGalleryImages(
  product: CatalogImageProduct,
): string[] {
  return galleryFromSlots({ product, preferStorefront: true });
}

/**
 * Cadde `/tr/parca` gallery: transparent packshot PNGs + lifestyle.
 * Do not use storefront WebP here (background is baked in).
 */
export function getMarketplaceGalleryImages(
  product: CatalogImageProduct,
): string[] {
  return galleryFromSlots({ product, preferStorefront: false });
}

/**
 * Panel list/stock thumbs: smallest display file (storefront WebP when present).
 */
export function getPanelProductCover(
  product: CatalogImageProduct,
): string | null {
  return (
    getProductCoverImageFor("boutique", product) ??
    getProductCoverImageFor("marketplace", product) ??
    getBoutiqueProductImages(product)[0] ??
    null
  );
}

/**
 * First lifestyle / model shot for card hover reveal (if any).
 */
export function getProductHoverImage(
  product: Pick<TrProduct, "lifestyleImages">,
): string | null {
  return nonEmpty(product.lifestyleImages)[0] ?? null;
}

/**
 * Second catalog angle (usually back) for hover cycle when no model shot exists.
 */
export function getProductSecondaryImage(
  product: Pick<TrProduct, "images" | "marketplaceImages">,
): string | null {
  const list = getMarketplaceProductImages(product);
  if (list.length < 2) return null;
  const secondary = list[1]?.trim();
  if (!secondary || secondary === list[0]) return null;
  return secondary;
}

/** True when the cover should render as a contained cutout (not full-bleed cover). */
export function isCatalogCutoutImage(src: string | null | undefined): boolean {
  if (!src) return false;
  return (
    isLookbookPieceImage(src) ||
    isTrMarketplaceAssetUrl(src) ||
    src.startsWith("/images/tr/hero/")
  );
}
