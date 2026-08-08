import { isLookbookPieceImage } from "@/data/tr/lookbookPieceImages";
import { isTrMarketplaceAssetUrl } from "@/lib/tr/trAssetUrls";
import type { TrProduct } from "@/types/tr-marketplace";

export type TrProductImageSurface = "boutique" | "marketplace";

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
 */
export function getMarketplaceProductImages(
  product: Pick<TrProduct, "images" | "marketplaceImages">,
): string[] {
  const resolved = resolveProductImagesPerIndex(product);
  if (resolved.length > 0) return resolved;
  return getBoutiqueProductImages(product);
}

export function getProductCoverImageFor(
  surface: TrProductImageSurface,
  product: Pick<TrProduct, "images" | "marketplaceImages">,
): string | null {
  // Customer-facing covers always prefer cutouts when any exist.
  const marketplace = getMarketplaceProductImages(product);
  if (marketplace.length > 0) return marketplace[0] ?? null;
  if (surface === "boutique") {
    return getBoutiqueProductImages(product)[0] ?? null;
  }
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
 * Storefront PDP gallery: marketplace cutouts + lifestyle, then remaining
 * boutique originals so multi-photo thumbs appear like owner galleries.
 */
export function getStorefrontGalleryImages(
  product: Pick<TrProduct, "images" | "marketplaceImages" | "lifestyleImages">,
): string[] {
  const catalog = getMarketplaceProductImages(product);
  const lifestyle = nonEmpty(product.lifestyleImages);
  const boutique = getBoutiqueProductImages(product);
  const seen = new Set<string>();
  const out: string[] = [];

  for (const url of [...catalog, ...lifestyle, ...boutique]) {
    const trimmed = url.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }

  return out;
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
