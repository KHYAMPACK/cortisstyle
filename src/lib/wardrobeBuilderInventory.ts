import { clothingItems } from "@/data/items";
import { looks } from "@/data/looks";
import type { ClothingItem } from "@/types/item";
import type { MatrixCategoryFilter } from "@/types/wardrobe-builder";
import type { WardrobeClothingItem } from "@/types/user";

const ITEM_MATRIX_CATEGORIES: Record<string, MatrixCategoryFilter[]> = {
  "black-beanie-01": ["HAT"],
  "cap-01": ["HAT"],
  "black-sunglasses-01": ["EYEWEAR"],
  "sunglasses-01": ["EYEWEAR"],
  "sunglasses-02": ["EYEWEAR"],
  "necklace-01": ["ACC_HEAD"],
  "necklace-02": ["ACC_HEAD"],
  "bracelet-01": ["WAIST"],
  "longsleeve-shirt-01": ["OUTER"],
  "compression-shirt-01": ["TOP"],
  "tank-top-01": ["TOP"],
  "black-bag-01": ["BAG"],
  "black-bag-02": ["BAG"],
  "teal-bag-01": ["BAG"],
  "bootcut-jeans-02": ["BOTTOM"],
  "baggy-jeans-01": ["BOTTOM"],
  "shorts-01": ["BOTTOM"],
  "sneakers-01": ["SHOES"],
  "sneakers-02": ["SHOES"],
  "sneakers-03": ["SHOES"],
};

function inferMatrixCategories(item: ClothingItem): MatrixCategoryFilter[] {
  const mapped = ITEM_MATRIX_CATEGORIES[item.id];
  if (mapped) return mapped;

  const name = item.name.toLowerCase();

  if (name.includes("sunglass") || name.includes("eyewear")) return ["EYEWEAR"];
  if (item.category === "headwear") return ["HAT"];
  if (name.includes("beanie") || name.includes("cap")) return ["HAT"];
  if (name.includes("necklace")) return ["ACC_HEAD"];
  if (name.includes("bracelet")) return ["WAIST"];
  if (name.includes("bag")) return ["BAG"];
  if (item.category === "shoes") return ["SHOES"];
  if (item.category === "bottoms") return ["BOTTOM"];
  if (name.includes("long-sleeve") || name.includes("jacket")) return ["OUTER"];
  if (item.category === "tops") return ["TOP"];
  if (item.category === "accessories") return ["ACC_HEAD"];

  return ["TOP"];
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
