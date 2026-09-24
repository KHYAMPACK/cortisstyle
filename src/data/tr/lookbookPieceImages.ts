import { isTrAssetUrl, isTrMarketplaceAssetUrl } from "@/lib/tr/trAssetUrls";

/**
 * Isolated garment cutouts formerly used as temporary TR product imagery.
 * Emptied during cloth reset — boutiques re-upload real catalog images.
 */
export const TR_LOOKBOOK_PIECE_IMAGES: readonly string[] = [];

export function isLookbookPieceImage(src: string | null | undefined): boolean {
  if (!src) return false;
  return src.startsWith("/images/clothes/");
}

function stableIndex(key: string, modulo: number): number {
  if (modulo <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
}

function hasRealCatalogImagery(product: {
  images: string[];
  marketplaceImages?: string[];
}): boolean {
  const marketplace = (product.marketplaceImages ?? []).filter((src) =>
    Boolean(src?.trim()),
  );
  if (marketplace.length > 0) return true;

  return product.images.some(
    (src) =>
      Boolean(src?.trim()) &&
      (isLookbookPieceImage(src) ||
        isTrMarketplaceAssetUrl(src) ||
        isTrAssetUrl(src)),
  );
}

/**
 * Resolve display images for a TR product.
 * Lookbook cutout injection is disabled while the piece pool is empty.
 */
export function resolveTrProductImages(product: {
  id: string;
  images: string[];
  marketplaceImages?: string[];
}): string[] {
  const existing = product.images.filter((src) => Boolean(src?.trim()));
  if (hasRealCatalogImagery(product)) {
    return existing.length > 0
      ? existing
      : (product.marketplaceImages ?? []).filter((src) => Boolean(src?.trim()));
  }

  if (TR_LOOKBOOK_PIECE_IMAGES.length === 0) {
    return existing;
  }

  const idx = stableIndex(product.id, TR_LOOKBOOK_PIECE_IMAGES.length);
  return [TR_LOOKBOOK_PIECE_IMAGES[idx]!];
}

export function withLookbookPieceImages<
  T extends { id: string; images: string[]; marketplaceImages?: string[] },
>(product: T): T {
  if (hasRealCatalogImagery(product) || TR_LOOKBOOK_PIECE_IMAGES.length === 0) {
    return product;
  }

  return {
    ...product,
    images: resolveTrProductImages(product),
  };
}
