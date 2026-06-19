import { getClothingItem } from "@/data/items";
import type { Look, ResolvedLookItem } from "@/types/look";

export function resolveLookItems(look: Look): ResolvedLookItem[] {
  return look.items.map((placement) => {
    const item = getClothingItem(placement.itemId);

    if (!item) {
      throw new Error(
        `Clothing item "${placement.itemId}" referenced by look "${look.id}" was not found.`,
      );
    }

    return {
      ...item,
      coordinates: placement.coordinates,
    };
  });
}

export function resolveEditableLookItems(look: Look): ResolvedLookItem[] {
  return structuredClone(resolveLookItems(look));
}
