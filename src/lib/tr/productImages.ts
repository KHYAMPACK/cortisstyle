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
 * Per-index resolve: prefer marketplace cutout at i, else boutique original at i.
 * Keeps cover/gallery alignment when some cutouts failed.
 */
export function resolveProductImagesPerIndex(
  product: Pick<TrProduct, "images" | "marketplaceImages">,
): string[] {
  const originals = product.images ?? [];
  const marketplace = product.marketplaceImages ?? [];
  const length = Math.max(originals.length, marketplace.length);
  const out: string[] = [];
  for (let i = 0; i < length; i++) {
    const cutout = marketplace[i]?.trim();
    const original = originals[i]?.trim();
    const picked = cutout || original;
    if (picked) out.push(picked);
  }
  return out;
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
  const list =
    surface === "marketplace"
      ? getMarketplaceProductImages(product)
      : getBoutiqueProductImages(product);
  return list[0] ?? null;
}

export function hasRealMarketplaceImagery(
  product: Pick<TrProduct, "images" | "marketplaceImages">,
): boolean {
  if (nonEmpty(product.marketplaceImages).length > 0) return true;
  return nonEmpty(product.images).some(
    (url) => isTrMarketplaceAssetUrl(url) || isLookbookPieceImage(url),
  );
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
