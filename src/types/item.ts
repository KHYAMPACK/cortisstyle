export type ClothingCategory =
  | "headwear"
  | "eyewear"
  | "tops"
  | "outerwear"
  | "bottoms"
  | "shoes"
  | "bags"
  | "waist"
  | "accessories";

export interface CanvasPosition {
  top: string;
  left: string;
  width: string;
  zIndex: number;
}

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  brand: string;
  shopUrl: string;
  displayModel?: string;
  estPriceRange: string;
  budgetAlternativeUrl: string;
  canvasImage?: string;
  defaultCanvasPosition?: CanvasPosition;
}
