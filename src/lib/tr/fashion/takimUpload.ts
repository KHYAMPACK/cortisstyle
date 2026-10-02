import { isTrMarketplaceAssetUrl } from "@/lib/tr/trAssetUrls";
import type { TrProduct, TrProductFeatures } from "@/types/tr-marketplace";

/**
 * Takım (two-piece set) products. A set made by the parked AI pipeline keeps a packshot
 * per piece in `marketplaceImages[0..1]`; one added by hand is a plain gallery.
 */

/** Per-piece packshots in `marketplaceImages` of an AI-made set. */
const TAKIM_PACKSHOT_1 = 0;
const TAKIM_PACKSHOT_2 = 1;

export function isTakimCatalogProduct(
  product: Pick<TrProduct, "features"> | { features?: TrProductFeatures | null },
): boolean {
  return product.features?.uploadKind === "takim";
}

export function takimPackshotUrls(product: {
  marketplaceImages?: string[] | null;
  features?: TrProductFeatures | null;
}): string[] {
  if (!isTakimCatalogProduct(product)) return [];
  const market = product.marketplaceImages ?? [];
  return [market[TAKIM_PACKSHOT_1], market[TAKIM_PACKSHOT_2]]
    .map((url) => url?.trim() || "")
    .filter((url) => Boolean(url) && isTrMarketplaceAssetUrl(url));
}
