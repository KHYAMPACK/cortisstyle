export type WardrobeMatrixSlotIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface WardrobeMatrixSlotDefinition {
  index: WardrobeMatrixSlotIndex;
  coordinate: string;
  label: string;
}

export const WARDROBE_MATRIX_SLOTS: WardrobeMatrixSlotDefinition[] = [
  { index: 0, coordinate: "[1,1]", label: "[ acc_head ]" },
  { index: 1, coordinate: "[1,2]", label: "[ hat ]" },
  { index: 2, coordinate: "[1,3]", label: "[ eyewear ]" },
  { index: 3, coordinate: "[2,1]", label: "[ outer ]" },
  { index: 4, coordinate: "[2,2]", label: "[ top ]" },
  { index: 5, coordinate: "[2,3]", label: "[ bag ]" },
  { index: 6, coordinate: "[3,1]", label: "[ shoes ]" },
  { index: 7, coordinate: "[3,2]", label: "[ bottom ]" },
  { index: 8, coordinate: "[3,3]", label: "[ waist ]" },
];

export type WardrobeOutfitMatrix = Array<null>;

export function createEmptyOutfitMatrix(): WardrobeOutfitMatrix {
  return Array(9).fill(null);
}
