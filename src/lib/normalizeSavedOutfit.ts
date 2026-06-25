import { normalizeLayoutOverrides } from "@/lib/wardrobeDragLayout";
import { normalizeCanvasBg } from "@/lib/wardrobeCanvasBackground";
import type { SavedWardrobeOutfitBlueprint, WardrobeOutfitMatrix } from "@/types/wardrobe-builder";

export function normalizeOutfitMatrix(
  slots: unknown,
): WardrobeOutfitMatrix {
  if (!Array.isArray(slots) || slots.length !== 9) {
    return Array(9).fill(null);
  }

  return slots as WardrobeOutfitMatrix;
}

export function normalizeSavedOutfitBlueprint(
  raw: Partial<SavedWardrobeOutfitBlueprint> & { id?: string },
): SavedWardrobeOutfitBlueprint {
  const layoutOverrides = normalizeLayoutOverrides(raw.layoutOverrides);

  return {
    id: raw.id ?? `saved-outfit-${Date.now()}`,
    name: raw.name ?? "",
    moodword: raw.moodword ?? "",
    moodImageUrl: raw.moodImageUrl ?? null,
    canvasBg: normalizeCanvasBg(raw.canvasBg),
    slots: normalizeOutfitMatrix(raw.slots),
    savedAt: raw.savedAt ?? new Date().toISOString(),
    ...(layoutOverrides ? { layoutOverrides } : {}),
  };
}
