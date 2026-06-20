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
  stackOrder: number;
}

export const WARDROBE_MATRIX_SLOTS: WardrobeMatrixSlotDefinition[] = [
  {
    index: 0,
    coordinate: "[1,1]",
    label: "[ acc_head ]",
    categoryFilter: "ACC_HEAD",
    stackOrder: 15,
  },
  {
    index: 1,
    coordinate: "[1,2]",
    label: "[ hat ]",
    categoryFilter: "HAT",
    stackOrder: 15,
  },
  {
    index: 2,
    coordinate: "[1,3]",
    label: "[ eyewear ]",
    categoryFilter: "EYEWEAR",
    stackOrder: 30,
  },
  {
    index: 3,
    coordinate: "[2,1]",
    label: "[ outer ]",
    categoryFilter: "OUTER",
    stackOrder: 20,
  },
  {
    index: 4,
    coordinate: "[2,2]",
    label: "[ top ]",
    categoryFilter: "TOP",
    stackOrder: 20,
  },
  {
    index: 5,
    coordinate: "[2,3]",
    label: "[ bag ]",
    categoryFilter: "BAG",
    stackOrder: 30,
  },
  {
    index: 6,
    coordinate: "[3,1]",
    label: "[ shoes ]",
    categoryFilter: "SHOES",
    stackOrder: 5,
  },
  {
    index: 7,
    coordinate: "[3,2]",
    label: "[ bottom ]",
    categoryFilter: "BOTTOM",
    stackOrder: 10,
  },
  {
    index: 8,
    coordinate: "[3,3]",
    label: "[ waist ]",
    categoryFilter: "WAIST",
    stackOrder: 15,
  },
];

export interface WardrobeEquippedItem {
  id: string;
  name: string;
  image: string;
  rarityScore: number;
  categoryFilter: MatrixCategoryFilter;
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
