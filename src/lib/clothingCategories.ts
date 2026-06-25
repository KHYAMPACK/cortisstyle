import type { ClothingCategory } from "@/types/item";

export const CLOTHING_CATEGORY_ORDER: ClothingCategory[] = [
  "tops",
  "bottoms",
  "outerwear",
  "shoes",
  "bags",
  "headwear",
  "eyewear",
  "waist",
  "accessories",
];

const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  outerwear: "Outerwear",
  shoes: "Shoes",
  bags: "Bags",
  headwear: "Headwear",
  eyewear: "Eyewear",
  waist: "Waist",
  accessories: "Accessories",
};

export function formatClothingCategoryLabel(category: ClothingCategory): string {
  return CATEGORY_LABELS[category];
}

export function sortClothingCategories(
  categories: Iterable<ClothingCategory>,
): ClothingCategory[] {
  const unique = new Set(categories);
  return CLOTHING_CATEGORY_ORDER.filter((category) => unique.has(category));
}
