import { isLookbookPieceImage } from "@/data/tr/lookbookPieceImages";
import { TR_OWNER_PRODUCT_LIMITS } from "@/lib/tr/ownerProductConstraints";
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
 * Storefront PDP gallery: prefer marketplace cutouts (and lifestyle).
 * Raw boutique uploads are owner-only for processed front/back slots —
 * only unused extra slots (beyond cutout slots) may appear as originals.
 */
export function getStorefrontGalleryImages(
  product: Pick<TrProduct, "images" | "marketplaceImages" | "lifestyleImages">,
): string[] {
  const boutique = product.images ?? [];
  const market = product.marketplaceImages ?? [];
  const lifestyle = nonEmpty(product.lifestyleImages);
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

  const slotCount = Math.max(boutique.length, market.length);
  for (let i = 0; i < slotCount; i += 1) {
    const cutout = market[i]?.trim();
    const original = boutique[i]?.trim();
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
