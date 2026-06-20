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
  return {
    id: raw.id ?? `saved-outfit-${Date.now()}`,
    name: raw.name ?? "",
    moodword: raw.moodword ?? "",
    moodImageUrl: raw.moodImageUrl ?? null,
    slots: normalizeOutfitMatrix(raw.slots),
    savedAt: raw.savedAt ?? new Date().toISOString(),
  };
}
