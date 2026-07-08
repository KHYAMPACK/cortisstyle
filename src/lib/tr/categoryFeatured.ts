import {
  TR_BOUTIQUE_CATEGORIES,
  type TrCategoryDefinition,
} from "@/lib/tr/categories";
import { getProductCoverImage } from "@/lib/tr/paths";
import type { TrProduct } from "@/types/tr-marketplace";

export interface TrFeaturedCategoryTile {
  category: TrCategoryDefinition;
  coverImage: string | null;
}

const FEATURED_TILE_LIMIT = 4;

/** Pick up to four category tiles with a cover image from the catalog. */
export function buildFeaturedCategoryTiles(
  products: TrProduct[],
): TrFeaturedCategoryTile[] {
  const available = products.filter((product) => product.status === "available");
  const tiles: TrFeaturedCategoryTile[] = [];

  for (const category of TR_BOUTIQUE_CATEGORIES) {
    if (tiles.length >= FEATURED_TILE_LIMIT) break;

    const match = available.find(
      (product) => product.category?.trim() === category.id,
    );
    if (!match) continue;

    tiles.push({
      category,
      coverImage: getProductCoverImage(match),
    });
  }

  return tiles;
}
