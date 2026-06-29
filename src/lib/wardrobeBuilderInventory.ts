import { getLooks } from "@/data/looks";
import { getClothingItem } from "@/data/items";
import { isUnlockedArchiveLook } from "@/lib/launchGates";
import type { ClothingItem } from "@/types/item";
import type { MatrixCategoryFilter } from "@/types/wardrobe-builder";
import type { WardrobeClothingItem } from "@/types/user";
import type { Look } from "@/types/look";


export function inferMatrixCategories(item: ClothingItem): MatrixCategoryFilter[] {
  if (item.category === "eyewear") return ["EYEWEAR"];
  if (item.category === "headwear") return ["HAT"];
  if (item.category === "accessories") return ["ACC_HEAD"];
  if (item.category === "waist") return ["WAIST"];
  if (item.category === "bags") return ["BAG"];
  if (item.category === "shoes") return ["SHOES"];
  if (item.category === "bottoms") return ["BOTTOM"];
  if (item.category === "outerwear") return ["OUTER"];
  if (item.category === "tops") return ["TOP"];

  return ["ACC_HEAD"];
}

export function resolveItemSourceLookId(itemId: string): string {
  for (const look of getLooks()) {
    if (look.items.some((placement) => placement.itemId === itemId)) {
      return look.id;
    }
  }

  return "look-01";
}

export function resolveBuilderInventory(
  ownedClothes: WardrobeClothingItem[],
): WardrobeClothingItem[] {
  return ownedClothes;
}

export function itemMatchesMatrixCategory(
  item: ClothingItem,
  categoryFilter: MatrixCategoryFilter,
): boolean {
  return inferMatrixCategories(item).includes(categoryFilter);
}

export function filterInventoryByCategory(
  items: WardrobeClothingItem[],
  categoryFilter: MatrixCategoryFilter | null,
): WardrobeClothingItem[] {
  if (!categoryFilter) return [];

  return items.filter((item) => itemMatchesMatrixCategory(item, categoryFilter));
}

export function lookHasMatrixCategory(
  look: Look,
  categoryFilter: MatrixCategoryFilter,
): boolean {
  return look.items.some((placement) => {
    const item = getClothingItem(placement.itemId);
    return item ? itemMatchesMatrixCategory(item, categoryFilter) : false;
  });
}

/** First unlocked lookbook look that includes this matrix slot category. */
export function resolveLookCardForMatrixCategory(
  categoryFilter: MatrixCategoryFilter,
): Look | null {
  const unlockedLooks = getLooks().filter((look) => isUnlockedArchiveLook(look.id));

  const categoryMatch = unlockedLooks.find((look) =>
    lookHasMatrixCategory(look, categoryFilter),
  );
  if (categoryMatch) return categoryMatch;

  return unlockedLooks[0] ?? null;
}

export function getLookbookLookPath(lookId: string): string {
  return `/?look=${encodeURIComponent(lookId)}#lookbook-collection`;
}
