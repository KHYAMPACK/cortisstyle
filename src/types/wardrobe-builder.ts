export type WardrobeMatrixSlotIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type MatrixCategoryFilter =
  | "ACC_HEAD"
  | "HAT"
  | "EYEWEAR"
  | "OUTER"
  | "TOP"
  | "BAG"
  | "SHOES"
  | "BOTTOM"
  | "WAIST";

export interface WardrobeMatrixSlotDefinition {
  index: WardrobeMatrixSlotIndex;
  coordinate: string;
  label: string;
  categoryFilter: MatrixCategoryFilter;
}

export const WARDROBE_MATRIX_SLOTS: WardrobeMatrixSlotDefinition[] = [
  {
    index: 0,
    coordinate: "[1,1]",
    label: "[ eyewear ]",
    categoryFilter: "EYEWEAR",
  },
  {
    index: 1,
    coordinate: "[1,2]",
    label: "[ hat ]",
    categoryFilter: "HAT",
  },
  {
    index: 2,
    coordinate: "[1,3]",
    label: "[ acc_head ]",
    categoryFilter: "ACC_HEAD",
  },
  {
    index: 3,
    coordinate: "[2,1]",
    label: "[ outer ]",
    categoryFilter: "OUTER",
  },
  {
    index: 4,
    coordinate: "[2,2]",
    label: "[ top ]",
    categoryFilter: "TOP",
  },
  {
    index: 5,
    coordinate: "[2,3]",
    label: "[ bag ]",
    categoryFilter: "BAG",
  },
  {
    index: 6,
    coordinate: "[3,1]",
    label: "[ shoes ]",
    categoryFilter: "SHOES",
  },
  {
    index: 7,
    coordinate: "[3,2]",
    label: "[ bottom ]",
    categoryFilter: "BOTTOM",
  },
  {
    index: 8,
    coordinate: "[3,3]",
    label: "[ waist ]",
    categoryFilter: "WAIST",
  },
];

export interface WardrobeEquippedItem {
  id: string;
  categoryFilter: MatrixCategoryFilter;
  slotIndex: WardrobeMatrixSlotIndex;
  sourceLookId?: string;
}

export type WardrobeOutfitMatrix = Array<WardrobeEquippedItem | null>;

export function createEmptyOutfitMatrix(): WardrobeOutfitMatrix {
  return Array(9).fill(null);
}

export function getSlotDefinition(
  index: WardrobeMatrixSlotIndex,
): WardrobeMatrixSlotDefinition {
  return WARDROBE_MATRIX_SLOTS[index];
}

export const WARDROBE_BUILDER_LOOK = {
  id: "wardrobe-builder",
  layout: "collage" as const,
};

export interface WardrobeOutfitCardMeta {
  name: string;
  moodImageUrl: string | null;
}

export interface SavedWardrobeOutfitBlueprint extends WardrobeOutfitCardMeta {
  id: string;
  slots: WardrobeOutfitMatrix;
  savedAt: string;
}

export const DEFAULT_OUTFIT_CARD_META: WardrobeOutfitCardMeta = {
  name: "",
  moodImageUrl: null,
};
