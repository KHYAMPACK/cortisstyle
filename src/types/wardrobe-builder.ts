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
  alignClass: string;
  assetWrapperClass: string;
  assetBoundsClass: string;
  isAssignable: boolean;
}

export const WARDROBE_MATRIX_ROW_HEIGHTS = {
  head: "80px",
  torso: "160px",
  leg: "300px",
} as const;

export const WARDROBE_MATRIX_SLOTS: WardrobeMatrixSlotDefinition[] = [
  {
    index: 0,
    coordinate: "[1,1]",
    label: "[ eyewear ]",
    categoryFilter: "EYEWEAR",
    stackOrder: 30,
    alignClass: "items-start justify-center",
    assetWrapperClass: "-translate-y-1",
    assetBoundsClass: "h-[80px] w-full max-w-full",
    isAssignable: true,
  },
  {
    index: 1,
    coordinate: "[1,2]",
    label: "[ hat ]",
    categoryFilter: "HAT",
    stackOrder: 15,
    alignClass: "items-start justify-center",
    assetWrapperClass: "",
    assetBoundsClass: "h-[80px] w-full max-w-full",
    isAssignable: true,
  },
  {
    index: 2,
    coordinate: "[1,3]",
    label: "[ acc_head ]",
    categoryFilter: "ACC_HEAD",
    stackOrder: 15,
    alignClass: "items-start justify-end",
    assetWrapperClass: "",
    assetBoundsClass: "h-[80px] w-full max-w-full",
    isAssignable: false,
  },
  {
    index: 3,
    coordinate: "[2,1]",
    label: "[ outer ]",
    categoryFilter: "OUTER",
    stackOrder: 20,
    alignClass: "items-end justify-center",
    assetWrapperClass: "translate-y-2",
    assetBoundsClass: "h-[160px] w-full max-w-full",
    isAssignable: true,
  },
  {
    index: 4,
    coordinate: "[2,2]",
    label: "[ top ]",
    categoryFilter: "TOP",
    stackOrder: 20,
    alignClass: "items-end justify-center",
    assetWrapperClass: "translate-y-1",
    assetBoundsClass: "h-[160px] w-full max-w-full",
    isAssignable: true,
  },
  {
    index: 5,
    coordinate: "[2,3]",
    label: "[ bag ]",
    categoryFilter: "BAG",
    stackOrder: 30,
    alignClass: "items-end justify-end",
    assetWrapperClass: "translate-x-6 -translate-y-6",
    assetBoundsClass: "h-[160px] w-full max-w-full",
    isAssignable: true,
  },
  {
    index: 6,
    coordinate: "[3,1]",
    label: "[ shoes ]",
    categoryFilter: "SHOES",
    stackOrder: 30,
    alignClass: "items-end justify-center",
    assetWrapperClass: "translate-y-3",
    assetBoundsClass: "h-[280px] w-full max-w-full",
    isAssignable: true,
  },
  {
    index: 7,
    coordinate: "[3,2]",
    label: "[ bottom ]",
    categoryFilter: "BOTTOM",
    stackOrder: 10,
    alignClass: "items-start justify-center",
    assetWrapperClass: "-translate-y-2",
    assetBoundsClass: "h-[280px] w-full max-w-full",
    isAssignable: true,
  },
  {
    index: 8,
    coordinate: "[3,3]",
    label: "[ waist ]",
    categoryFilter: "WAIST",
    stackOrder: 15,
    alignClass: "items-end justify-end",
    assetWrapperClass: "translate-x-2 translate-y-2",
    assetBoundsClass: "h-[280px] w-full max-w-full",
    isAssignable: true,
  },
];

export interface WardrobeEquippedItem {
  id: string;
  name: string;
  image: string;
  rarityScore: number;
  categoryFilter: MatrixCategoryFilter;
  widthPx: number;
  heightPx: number;
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
