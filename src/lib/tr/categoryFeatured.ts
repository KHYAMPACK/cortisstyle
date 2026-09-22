import {
  isTrCategoryMatch,
  listTrCategoryRoots,
  type TrCategoryDefinition,
} from "@/lib/tr/fashion/categories";
import { getProductCoverImage } from "@/lib/tr/paths";
import type { TrProduct } from "@/types/tr-marketplace";

export interface TrFeaturedCategoryTile {
  category: TrCategoryDefinition;
  coverImage: string | null;
}

const FEATURED_TILE_LIMIT = 4;

/** Pick up to four root category tiles with a cover image from the catalog. */
export function buildFeaturedCategoryTiles(
  products: TrProduct[],
): TrFeaturedCategoryTile[] {
  const available = products.filter((product) => product.status === "available");
  const tiles: TrFeaturedCategoryTile[] = [];

  for (const category of listTrCategoryRoots()) {
    if (tiles.length >= FEATURED_TILE_LIMIT) break;

    const match = available.find((product) =>
      isTrCategoryMatch(product.category, category.id),
    );
    if (!match) continue;

    tiles.push({
      category,
      coverImage: getProductCoverImage(match),
    });
  }

  return tiles;
}
