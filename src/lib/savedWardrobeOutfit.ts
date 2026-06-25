import type { SavedWardrobeOutfitBlueprint } from "@/types/wardrobe-builder";
import { normalizeSavedOutfitBlueprint } from "@/lib/normalizeSavedOutfit";

const STORAGE_KEY = "cortis-saved-wardrobe-outfits";

export function loadSavedWardrobeOutfits(): SavedWardrobeOutfitBlueprint[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Partial<SavedWardrobeOutfitBlueprint>[];
    if (!Array.isArray(parsed)) return [];

    return parsed.map((entry) => normalizeSavedOutfitBlueprint(entry));
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

export function removeSavedWardrobeOutfitFromLocal(outfitId: string): void {
  if (typeof window === "undefined") return;

  const next = loadSavedWardrobeOutfits().filter((entry) => entry.id !== outfitId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function updateSavedWardrobeOutfitLocally(
  blueprint: SavedWardrobeOutfitBlueprint,
): void {
  if (typeof window === "undefined") return;

  const existing = loadSavedWardrobeOutfits();
  const hasEntry = existing.some((entry) => entry.id === blueprint.id);
  const next = hasEntry
    ? existing.map((entry) => (entry.id === blueprint.id ? blueprint : entry))
    : [blueprint, ...existing];

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
