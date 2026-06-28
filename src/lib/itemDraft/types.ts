import type { ClothingCategory } from "@/types/item";
import type { RarityScore } from "@/types/rarity";

export interface ItemDraftInput {
  /** Exact product title — never rewritten by the pipeline. */
  name: string;
  shopUrl: string;
  pngPath: string;
  outfitFolder: string;
  id?: string;
  brandOverride?: string;
  copyImage?: boolean;
}

export interface ProductPageHints {
  title?: string;
  description?: string;
  brand?: string;
  price?: string;
  currency?: string;
  materials?: string;
  rawJsonLd?: unknown[];
}

export interface GeneratedItemDraft {
  id: string;
  name: string;
  shopUrl: string;
  brand: string;
  category: ClothingCategory;
  displayModel?: string;
  estPriceRange: string;
  budgetAlternativeUrl: string;
  suggestedRarityScore: RarityScore;
  canvasImage: string;
  productHints: ProductPageHints;
  guessedFields?: string[];
  llmNotes?: string;
  llmProvider?: string;
}

export interface ItemDraftArtifacts {
  draft: GeneratedItemDraft;
  draftJsonPath: string;
  snippetPath: string;
  copiedImagePath?: string;
}
