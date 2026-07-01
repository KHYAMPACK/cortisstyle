import type { ClothingCategory, ClothingItem, CanvasPosition } from "@/types/item";
import type { RarityScore } from "@/types/rarity";
import {
  buildClothingItemMap,
  getDynamicCatalog,
} from "@/lib/dynamicLooks/registry";

const DEFAULT_EST_PRICE_RANGE = "Contact archive for pricing";
const DEFAULT_BUDGET_ALTERNATIVE_URL = "https://www.forever21.com/";

interface DefineItemOptions {
  shopUrl?: string;
  displayModel?: string;
  estPriceRange?: string;
  budgetAlternativeUrl?: string;
  rarityScore?: RarityScore;
  canvasImage?: string;
  defaultCanvasPosition?: CanvasPosition;
}

/** Dev/script helper — catalog lives in src/data/dynamic-looks/*-items.json. */
export function defineItem(
  id: string,
  name: string,
  category: ClothingCategory,
  brand: string,
  options: DefineItemOptions = {},
): ClothingItem {
  const {
    shopUrl,
    displayModel,
    estPriceRange,
    budgetAlternativeUrl,
    rarityScore,
    canvasImage,
    defaultCanvasPosition,
  } = options;

  return {
    id,
    name,
    category,
    brand,
    shopUrl: shopUrl ?? `https://shopier.com/cortis/${id}`,
    displayModel,
    estPriceRange: estPriceRange ?? DEFAULT_EST_PRICE_RANGE,
    budgetAlternativeUrl:
      budgetAlternativeUrl ?? DEFAULT_BUDGET_ALTERNATIVE_URL,
    rarityScore: rarityScore ?? 1,
    canvasImage,
    defaultCanvasPosition,
  };
}

/** Legacy hook for scripts; runtime catalog is loaded from dynamic-looks JSON. */
export const clothingItems: ClothingItem[] = [];

let clothingItemMapCache: Map<string, ClothingItem> | null = null;

function resolveClothingItemMap(): Map<string, ClothingItem> {
  if (!clothingItemMapCache) {
    clothingItemMapCache = buildClothingItemMap(
      clothingItems,
      getDynamicCatalog().items,
    );
  }

  return clothingItemMapCache;
}

/** Rebuild item registry after server-side disk crawl (see buildCatalogFromDisk). */
export function refreshClothingItemRegistry(): void {
  clothingItemMapCache = null;
}

export function getClothingItem(id: string): ClothingItem | undefined {
  return resolveClothingItemMap().get(id);
}

export function getAllClothingItems(): ClothingItem[] {
  return [...resolveClothingItemMap().values()];
}
