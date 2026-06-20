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

export interface FitGuidance {
  type: string;
  fabricWeight: string;
  modelSpecs?: string;
}

export interface ResaleKeywords {
  tags: string;
  estPriceRange: string;
}

export interface StylingExecution {
  howToWear: string;
  textureSynergy: string;
}

export interface BudgetAlternativeLink {
  name: string;
  url: string;
}

export interface ItemFashionVectors {
  displayModel?: string;
  fitGuidance: FitGuidance;
  resaleKeywords: ResaleKeywords;
  stylingExecution: StylingExecution;
  budgetAlternativeLink: BudgetAlternativeLink;
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
  fitGuidance: FitGuidance;
  resaleKeywords: ResaleKeywords;
  stylingExecution: StylingExecution;
  budgetAlternativeLink: BudgetAlternativeLink;
  displayModel?: string;
}
