import type { TrProductType } from "@/types/tr-marketplace";

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
  /** Product types an owner can create, in the order the type chooser lists them. */
  productTypes: TrProductType[];
}
