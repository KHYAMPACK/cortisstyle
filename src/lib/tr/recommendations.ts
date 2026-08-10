import { isTrCategoryMatch } from "@/lib/tr/categories";
import type { TrLookWithProducts } from "@/types/tr-look";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

const DEFAULT_PRODUCT_LIMIT = 8;
const DEFAULT_LOOK_LIMIT = 4;

/** Stable order for SSR/client parity (no Math.random). */
function byId<T extends { id: string }>(a: T, b: T): number {
  return a.id.localeCompare(b.id);
}

/**
 * Prefer same category as seed, then fill from remaining available catalog.
 * Order is deterministic so SSR and client hydrate identically.
 */
export function pickRelatedProducts(input: {
  catalog: TrProductWithBoutique[];
  excludeIds?: Iterable<string>;
  category?: string | null;
  limit?: number;
}): TrProductWithBoutique[] {
  const limit = input.limit ?? DEFAULT_PRODUCT_LIMIT;
  const exclude = new Set(input.excludeIds ?? []);
  const category = input.category?.trim() || null;

  const pool = input.catalog
    .filter(
      (product) =>
        product.status === "available" && !exclude.has(product.id),
    )
    .sort(byId);

  const sameCategory = category
    ? pool.filter((product) => isTrCategoryMatch(product.category, category))
    : [];
  const rest = category
    ? pool.filter((product) => !isTrCategoryMatch(product.category, category))
    : pool;

  const picked: TrProductWithBoutique[] = [];
  for (const product of [...sameCategory, ...rest]) {
    if (picked.length >= limit) break;
    picked.push(product);
  }
  return picked;
}

export function pickRelatedLooks(input: {
  looks: TrLookWithProducts[];
  excludeIds?: Iterable<string>;
  limit?: number;
}): TrLookWithProducts[] {
  const limit = input.limit ?? DEFAULT_LOOK_LIMIT;
  const exclude = new Set(input.excludeIds ?? []);
  return input.looks
    .filter((look) => !exclude.has(look.id))
    .sort(byId)
    .slice(0, limit);
}

/** Favorited catalog products first (boutique cart / account recommendations). */
export function pickFavoriteProducts(input: {
  catalog: TrProductWithBoutique[];
  favoriteIds: Iterable<string>;
  excludeIds?: Iterable<string>;
  limit?: number;
}): TrProductWithBoutique[] {
  const limit = input.limit ?? DEFAULT_PRODUCT_LIMIT;
  const favoriteIds = new Set(input.favoriteIds);
  const exclude = new Set(input.excludeIds ?? []);
  if (favoriteIds.size === 0) return [];

  return input.catalog
    .filter(
      (product) =>
        favoriteIds.has(product.id) &&
        product.status === "available" &&
        !exclude.has(product.id),
    )
    .sort(byId)
    .slice(0, limit);
}
