export type ClothingCategory =
  | "headwear"
  | "tops"
  | "bottoms"
  | "shoes"
  | "accessories";

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  brand: string;
  blurredDescription: string;
  unlockedDescription: string;
  shopUrl: string;
}
