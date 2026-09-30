import type { TrCategory } from "@/lib/tr/categories/types";
import type { TrStorefrontTaxonomy } from "@/lib/tr/categories/taxonomy";
import {
  canonicalizeTrCategoryId,
  getTrCategoryLabel,
  getTrCategoryNavChildren,
  getTrCategoryRootId,
  getTrCategoryShopAllLabel,
  isTrCategoryMatch,
  listAssignableTrCategories,
  listCategoriesForProducts,
  listTrCategoryRoots,
  resolveTrCategoryDisplayLabel,
} from "@/lib/tr/fashion/categories";

/**
 * The built-in garment tree as a storefront taxonomy: every method is the function the
 * storefront called before categories became per boutique, so a boutique in `legacy`
 * mode (lilabutik today) renders exactly as it did.
 */
export const legacyFashionTaxonomy: TrStorefrontTaxonomy = {
  kind: "legacy",
  label: getTrCategoryLabel,
  displayLabel: resolveTrCategoryDisplayLabel,
  shopAllLabel: getTrCategoryShopAllLabel,
  roots: listTrCategoryRoots,
  navChildren: getTrCategoryNavChildren,
  isMatch: isTrCategoryMatch,
  rootId: getTrCategoryRootId,
  canonicalize: canonicalizeTrCategoryId,
  assignable: listAssignableTrCategories,
  forProducts: listCategoriesForProducts,
  imageUrl: () => null,
};

/**
 * "Tüm …" copy for an imported category: the built-in phrase ("Tüm elbiseler") while the
 * category still has its built-in name; the default otherwise.
 */
export function fashionShopAllLabelFor(
  category: Pick<TrCategory, "name" | "systemKey">,
): string | null {
  if (!category.systemKey) return null;
  if (getTrCategoryLabel(category.systemKey) !== category.name) return null;
  return getTrCategoryShopAllLabel(category.systemKey);
}
