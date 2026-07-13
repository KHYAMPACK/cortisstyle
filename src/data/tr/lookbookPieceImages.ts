import { isTrAssetUrl, isTrMarketplaceAssetUrl } from "@/lib/tr/trAssetUrls";

/**
 * Isolated garment cutouts from the international lookbook (`/public/images/clothes`).
 * Used as temporary TR product imagery until boutiques upload flat-lays + BG removal.
 */
export const TR_LOOKBOOK_PIECE_IMAGES = [
  "/images/clothes/outfit-01/compression-shirt-01.png",
  "/images/clothes/outfit-01/bootcut-jeans-02.png",
  "/images/clothes/outfit-01/black-bag-01.png",
  "/images/clothes/outfit-01/sneakers-01.png",
  "/images/clothes/outfit-01/black-beanie-01.png",
  "/images/clothes/outfit-01/black-sunglasses-01.png",
  "/images/clothes/outfit-02/longsleeve-shirt-01.png",
  "/images/clothes/outfit-02/shorts-01.png",
  "/images/clothes/outfit-02/black-bag-02.png",
  "/images/clothes/outfit-02/sneakers-02.png",
  "/images/clothes/outfit-02/sunglasses-02.png",
  "/images/clothes/outfit-02/necklace-01.png",
  "/images/clothes/outfit-03/tank-top-01.png",
  "/images/clothes/outfit-03/baggy-jeans-01.png",
  "/images/clothes/outfit-03/teal-bag-01.png",
  "/images/clothes/outfit-03/sneakers-03.png",
  "/images/clothes/outfit-03/cap-01.png",
  "/images/clothes/outfit-03/sunglasses-01.png",
  "/images/clothes/outfit-04/ember-top-black-01.png",
  "/images/clothes/outfit-04/gray-raw-denim-jacket-01.png",
  "/images/clothes/outfit-04/tweed-mini-skirt-with-decorative-belt-01.png",
  "/images/clothes/outfit-04/wide-heeeled-boots-01.png",
  "/images/clothes/outfit-04/studded-oversized-tote-bag-01.png",
  "/images/clothes/outfit-04/js-eyewear-5052-sunglasses-01.png",
  "/images/clothes/outfit-05/polo-ralph-lauren-women-s-shirt-01.png",
  "/images/clothes/outfit-05/women-s-tan-cream-coat-01.png",
  "/images/clothes/outfit-05/hollister-co-women-s-black-and-navy-shorts-01.png",
  "/images/clothes/outfit-05/zava-black-suede-ballerina-01.png",
  "/images/clothes/outfit-05/obosoyo-minimalist-burgundy-faux-leather-tote-ba-01.png",
  "/images/clothes/outfit-05/the-miu-miu-bayonetta-glasses-01.png",
  "/images/clothes/outfit-06/women-s-green-and-blue-vest-01.png",
  "/images/clothes/outfit-06/perfect-denims-01.png",
  "/images/clothes/outfit-06/burn-mark-zip-up-hoodi-01.png",
  "/images/clothes/outfit-06/women-s-brown-ballet-shoes-01.png",
  "/images/clothes/outfit-06/bright-yellow-bag-01.png",
  "/images/clothes/outfit-06/women-s-brown-and-silver-sunglasses-01.png",
  "/images/clothes/outfit-07/linen-cotton-blend-striped-shirt-01.png",
  "/images/clothes/outfit-07/v-neck-racerback-tank-01.png",
  "/images/clothes/outfit-07/black-soft-knee-length-wide-leg-jorts-01.png",
  "/images/clothes/outfit-07/women-s-black-ballet-shoes-01.png",
  "/images/clothes/outfit-07/scallop-shoulder-bag-01.png",
  "/images/clothes/outfit-07/verydior-m1u-wrap-around-acetate-sunglasses-01.png",
  "/images/clothes/outfit-07/glass-piece-necklaces-01.png",
  "/images/clothes/outfit-07/label-knit-wool-leg-warmers-01.png",
  "/images/clothes/outfit-a3ec0959/cider-maroon-striped-short-sleeve-shirt.png",
  "/images/clothes/outfit-a3ec0959/minga-washed-black-star-cutout-jeans.png",
  "/images/clothes/outfit-a3ec0959/nike-dunk-low-white-burgundy.png",
  "/images/clothes/outfit-a3ec0959/buckle-detail-shoulder-bag.png",
] as const;

/** Editorial full-look covers (model / OOTD frames) for TR kombin cards. */
export const TR_LOOKBOOK_LOOK_COVERS = [
  "/images/clothes/outfit-07/ootd281.png",
  "/images/clothes/outfit-06/ootd266.png",
  "/images/clothes/outfit-03/ootd237.png",
  "/images/clothes/outfit-010efe85/hero.png",
] as const;

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
 * Demo fallback only: replace placeholder/Unsplash images with lookbook cutouts.
 * Real boutique uploads and marketplace cutouts are kept as-is.
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

  const idx = stableIndex(product.id, TR_LOOKBOOK_PIECE_IMAGES.length);
  return [TR_LOOKBOOK_PIECE_IMAGES[idx]!];
}

export function withLookbookPieceImages<
  T extends { id: string; images: string[]; marketplaceImages?: string[] },
>(product: T): T {
  if (hasRealCatalogImagery(product)) {
    return product;
  }

  return {
    ...product,
    images: resolveTrProductImages(product),
  };
}
