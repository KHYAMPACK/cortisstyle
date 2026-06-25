import { getClothingItem } from "@/data/items";
import { inferMatrixCategories } from "@/lib/wardrobeBuilderInventory";
import type { Look } from "@/types/look";
import {
  createEmptyOutfitMatrix,
  WARDROBE_MATRIX_SLOTS,
  type SavedWardrobeOutfitBlueprint,
  type WardrobeOutfitMatrix,
} from "@/types/wardrobe-builder";

export function lookToWardrobeOutfitMatrix(look: Look): WardrobeOutfitMatrix {
  const matrix = createEmptyOutfitMatrix();

  for (const placement of look.items) {
    const item = getClothingItem(placement.itemId);
    if (!item?.canvasImage) continue;

    const categories = inferMatrixCategories(item);
    const slot = WARDROBE_MATRIX_SLOTS.find(
      (definition) =>
        matrix[definition.index] === null &&
        categories.includes(definition.categoryFilter),
    );

    if (!slot) continue;

    matrix[slot.index] = {
      id: item.id,
      categoryFilter: slot.categoryFilter,
      slotIndex: slot.index,
      sourceLookId: look.id,
    };
  }

  return matrix;
}

export function lookToBuilderBlueprint(look: Look): SavedWardrobeOutfitBlueprint {
  return {
    id: `look-template-${look.id}`,
    name: look.title,
    moodword: "",
    moodImageUrl: null,
    slots: lookToWardrobeOutfitMatrix(look),
    savedAt: new Date().toISOString(),
  };
}

export function isPersistedSavedOutfitBlueprint(
  blueprint: SavedWardrobeOutfitBlueprint,
): boolean {
  return !blueprint.id.startsWith("look-template-");
}
