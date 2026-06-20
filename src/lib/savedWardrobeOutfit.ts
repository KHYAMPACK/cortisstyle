import type { SavedWardrobeOutfitBlueprint } from "@/types/wardrobe-builder";

const STORAGE_KEY = "cortis-saved-wardrobe-outfits";

export function loadSavedWardrobeOutfits(): SavedWardrobeOutfitBlueprint[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as SavedWardrobeOutfitBlueprint[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedWardrobeOutfit(
  blueprint: SavedWardrobeOutfitBlueprint,
): void {
  if (typeof window === "undefined") return;

  const existing = loadSavedWardrobeOutfits();
  const next = [blueprint, ...existing.filter((entry) => entry.id !== blueprint.id)];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function createSavedOutfitBlueprint(
  blueprint: Omit<SavedWardrobeOutfitBlueprint, "id" | "savedAt">,
): SavedWardrobeOutfitBlueprint {
  return {
    ...blueprint,
    id: `saved-outfit-${Date.now()}`,
    savedAt: new Date().toISOString(),
  };
}
