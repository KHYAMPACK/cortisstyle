import { getClothingItem } from "@/data/items";
import { applyFlatLayLayerStackToLayouts, resolveDefaultCanvasLayerZIndexFromMatrix } from "@/lib/canvasLayerStack";
import { resolveCanvasLayouts } from "@/lib/canvasLayout";
import type { CanvasItemLayout } from "@/types/canvas-layout";
import type { ResolvedLookItem } from "@/types/look";
import type { MatrixCategoryFilter, WardrobeOutfitMatrix } from "@/types/wardrobe-builder";
import type { WardrobeClothingItem } from "@/types/user";

const PLACEHOLDER_COORDINATES = {
  from: { top: "0%", left: "0%" },
  to: { top: "0%", left: "0%" },
};

export function buildWardrobeBuilderSourceLookMap(
  currentOutfit: WardrobeOutfitMatrix,
  inventory: WardrobeClothingItem[],
): Record<string, string | undefined> {
  const sourceLookByItemId: Record<string, string | undefined> = {};

  for (const equipped of currentOutfit) {
    if (!equipped) continue;

    const inventoryItem = inventory.find((item) => item.id === equipped.id);
    sourceLookByItemId[equipped.id] =
      inventoryItem?.sourceLookId ?? equipped.sourceLookId;
  }

  return sourceLookByItemId;
}

export function buildWardrobeBuilderCategoryFilterMap(
  currentOutfit: WardrobeOutfitMatrix,
): Record<string, MatrixCategoryFilter> {
  const categoryFilterByItemId: Record<string, MatrixCategoryFilter> = {};

  for (const equipped of currentOutfit) {
    if (!equipped) continue;
    categoryFilterByItemId[equipped.id] = equipped.categoryFilter;
  }

  return categoryFilterByItemId;
}

export function resolveWardrobeBuilderLookItems(
  currentOutfit: WardrobeOutfitMatrix,
  inventory: WardrobeClothingItem[],
): ResolvedLookItem[] {
  const items: ResolvedLookItem[] = [];

  for (const equipped of currentOutfit) {
    if (!equipped) continue;

    const inventoryItem = inventory.find((item) => item.id === equipped.id);
    const clothingItem = inventoryItem ?? getClothingItem(equipped.id);
    if (!clothingItem?.canvasImage || !clothingItem.defaultCanvasPosition) {
      continue;
    }

    items.push({
      ...clothingItem,
      coordinates: PLACEHOLDER_COORDINATES,
    });
  }

  return items;
}

export function resolveWardrobeBuilderCanvasLayouts(
  items: ResolvedLookItem[],
  containerWidth: number,
  sourceLookByItemId: Record<string, string | undefined>,
  categoryFilterByItemId: Record<string, MatrixCategoryFilter>,
): Record<string, CanvasItemLayout> {
  const merged: Record<string, CanvasItemLayout> = {};

  for (const item of items) {
    const lookId = sourceLookByItemId[item.id] ?? "look-01";
    const layouts = resolveCanvasLayouts(lookId, [item], containerWidth);

    if (layouts[item.id]) {
      merged[item.id] = layouts[item.id];
    }
  }

  const layerByItemId = Object.fromEntries(
    items.map((item) => [
      item.id,
      resolveDefaultCanvasLayerZIndexFromMatrix(
        categoryFilterByItemId[item.id] ?? "TOP",
      ),
    ]),
  );

  return applyFlatLayLayerStackToLayouts(merged, layerByItemId);
}
