import {
  findRedirectedCategoryId,
  getBoutiqueCategoryMode,
  getSalesByProduct,
  listCategories,
  listProductIdsInCategories,
} from "@/lib/tr/catalog/categories";
import { safeGetBoutiqueStorefront } from "@/lib/tr/catalog/publicData";
import { sortProductsByCriterion } from "@/lib/tr/categories/sortCriteria";
import {
  categoryAndDescendantIds,
  categoryPath,
  childrenOf,
} from "@/lib/tr/categories/tree";
import type { TrCategory } from "@/lib/tr/categories/types";
import type { TrBoutiqueStorefront } from "@/types/tr-marketplace";

export type PublicCategoryPage =
  | {
      kind: "found";
      boutique: TrBoutiqueStorefront;
      category: TrCategory;
      /** Root → this category. */
      path: TrCategory[];
      children: TrCategory[];
      /** The category's products (and its subcategories'), in the category's own order. */
      products: TrBoutiqueStorefront["products"];
    }
  | { kind: "redirect"; toSlug: string }
  | { kind: "missing" };

/**
 * Everything a category page shows, for a boutique with its own categories. A
 * boutique on the built-in tree, an unknown slug, or a database without the category
 * tables is `missing`; a renamed slug redirects to the current one.
 */
export async function loadPublicCategoryPage(
  boutiqueSlug: string,
  categorySlug: string,
): Promise<PublicCategoryPage> {
  const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);
  if (!storefront) return { kind: "missing" };
  if ((await getBoutiqueCategoryMode(storefront.id)) !== "custom") {
    return { kind: "missing" };
  }

  const all = await listCategories(storefront.id);
  const category = all.find((entry) => entry.slug === categorySlug);
  if (!category) {
    const movedId = await findRedirectedCategoryId(storefront.id, categorySlug);
    const moved = movedId ? all.find((entry) => entry.id === movedId) : undefined;
    return moved ? { kind: "redirect", toSlug: moved.slug } : { kind: "missing" };
  }

  const members = await listProductIdsInCategories(
    categoryAndDescendantIds(all, category.id),
  );
  const inScope = storefront.products.filter((product) => members.has(product.id));
  const sales =
    category.sortCriterion === "best_selling"
      ? await getSalesByProduct(storefront.id)
      : undefined;

  return {
    kind: "found",
    boutique: storefront,
    category,
    path: categoryPath(all, category.id),
    children: childrenOf(all, category.id),
    products: sortProductsByCriterion(inScope, category.sortCriterion, sales),
  };
}
