export type TrCatalogProfileId = "fashion" | "custom_art";

export interface TrCatalogProfileCapabilities {
  showProductsNav: boolean;
  showStockNav: boolean;
  allowProductRoutes: boolean;
  showProductCreateCtas: boolean;
  showAiCreditsCard: boolean;
  pdpLayout: "split" | "custom_art";
  skipStockValidation: boolean;
  skipInventoryDecrement: boolean;
}
