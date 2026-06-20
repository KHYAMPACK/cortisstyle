import type { ClothingCategory } from "@/types/item";
import type { CanvasItemLayout } from "@/types/canvas-layout";
import type { MatrixCategoryFilter } from "@/types/wardrobe-builder";

/** Editorial mood reference — above canvas card, below blueprint and garments. */
export const CANVAS_LAYER_MOOD = 10;

/** Blueprint guide lines — above mood, below garments. */
export const CANVAS_LAYER_BLUEPRINT = 20;

/** Outerwear, tops, bottoms, waist. */
export const CANVAS_LAYER_MID = 30;

/** Footwear, bags, eyewear, hats, head accessories. */
export const CANVAS_LAYER_TOP = 35;

/** Active selection / highlight — always wins. */
export const CANVAS_LAYER_ACTIVE = 50;

const TOP_MATRIX_CATEGORIES = new Set<MatrixCategoryFilter>([
  "SHOES",
  "BAG",
  "EYEWEAR",
  "HAT",
  "ACC_HEAD",
]);

export function resolveDefaultCanvasLayerZIndexFromMatrix(
  category: MatrixCategoryFilter,
): number {
  return TOP_MATRIX_CATEGORIES.has(category)
    ? CANVAS_LAYER_TOP
    : CANVAS_LAYER_MID;
}

export function resolveDefaultCanvasLayerZIndexFromClothing(
  category: ClothingCategory,
): number {
  if (
    category === "shoes" ||
    category === "headwear" ||
    category === "accessories"
  ) {
    return CANVAS_LAYER_TOP;
  }

  return CANVAS_LAYER_MID;
}

export function resolveRenderedCanvasZIndex(
  baseZIndex: number,
  isActive: boolean,
): number {
  return isActive ? CANVAS_LAYER_ACTIVE : baseZIndex;
}

export function applyFlatLayLayerStackToLayouts(
  layouts: Record<string, CanvasItemLayout>,
  layerByItemId: Record<string, number>,
): Record<string, CanvasItemLayout> {
  const next: Record<string, CanvasItemLayout> = {};

  for (const [itemId, layout] of Object.entries(layouts)) {
    const stackZIndex = layerByItemId[itemId];

    next[itemId] = {
      ...layout,
      zIndex: stackZIndex ?? layout.zIndex ?? CANVAS_LAYER_MID,
    };
  }

  return next;
}

export function applyFlatLayLayerStackFromClothingItems(
  layouts: Record<string, CanvasItemLayout>,
  items: Array<{ id: string; category: ClothingCategory }>,
): Record<string, CanvasItemLayout> {
  const layerByItemId = Object.fromEntries(
    items.map((item) => [
      item.id,
      resolveDefaultCanvasLayerZIndexFromClothing(item.category),
    ]),
  );

  return applyFlatLayLayerStackToLayouts(layouts, layerByItemId);
}
