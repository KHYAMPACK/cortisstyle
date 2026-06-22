import { clothingItems } from "@/data/items";
import { looks } from "@/data/looks";
import type { ClothingItem } from "@/types/item";
import type { MatrixCategoryFilter } from "@/types/wardrobe-builder";
import type { WardrobeClothingItem } from "@/types/user";


function inferMatrixCategories(item: ClothingItem): MatrixCategoryFilter[] {
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
  for (const look of looks) {
    if (look.items.some((placement) => placement.itemId === itemId)) {
      return look.id;
    }
  }

  return "look-01";
}

export function resolveBuilderInventory(
  ownedClothes: WardrobeClothingItem[],
): WardrobeClothingItem[] {
  if (ownedClothes.length > 0) {
    return ownedClothes;
  }

  return clothingItems.map((item) => ({
    ...item,
    sourceLookId: resolveItemSourceLookId(item.id),
  }));
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
