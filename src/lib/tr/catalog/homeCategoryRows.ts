import {
  canonicalizeTrCategoryId,
  getTrCategoryLabel,
  listAssignableTrCategories,
} from "@/lib/tr/catalog/categories";

export type HomeCategoryProductGroup<
  T extends { category: string | null; sortOrder: number },
> = {
  categoryId: string;
  label: string;
  products: T[];
};

/**
 * Home showcase: keep each shop-leaf category together so a grid row
 * is never a mix (desktop 4-up = one category per row; mobile 2-up means
 * two rows of the same category before the next one, unless that category
 * has more products — then it continues).
 */
export function groupProductsForHomeCategoryRows<
  T extends { category: string | null; sortOrder: number },
>(products: T[]): HomeCategoryProductGroup<T>[] {
  const taxonomyOrder = new Map(
    listAssignableTrCategories().map((entry, index) => [entry.id, index]),
  );
  const buckets = new Map<string, T[]>();
  const uncategorized: T[] = [];

  for (const product of products) {
    const categoryId = canonicalizeTrCategoryId(product.category);
    if (!categoryId) {
      uncategorized.push(product);
      continue;
    }
    const list = buckets.get(categoryId) ?? [];
    list.push(product);
    buckets.set(categoryId, list);
  }

  const bySort = (a: T, b: T) => a.sortOrder - b.sortOrder;

  const groups: HomeCategoryProductGroup<T>[] = [...buckets.entries()]
    .sort((a, b) => {
      const rankA = taxonomyOrder.get(a[0]) ?? 1000;
      const rankB = taxonomyOrder.get(b[0]) ?? 1000;
      if (rankA !== rankB) return rankA - rankB;
      return a[0].localeCompare(b[0], "tr");
    })
    .map(([categoryId, items]) => ({
      categoryId,
      label: getTrCategoryLabel(categoryId) ?? categoryId,
      products: [...items].sort(bySort),
    }));

  if (uncategorized.length > 0) {
    groups.push({
      categoryId: "diger",
      label: "Diğer",
      products: [...uncategorized].sort(bySort),
    });
  }

  return groups;
}
