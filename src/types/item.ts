export type ClothingCategory =
  | "headwear"
  | "tops"
  | "bottoms"
  | "shoes"
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
  blurredDescription: string;
  unlockedDescription: string;
  shopUrl: string;
  canvasImage?: string;
  defaultCanvasPosition?: CanvasPosition;
}
