import type {
  TrCatalogProfileCapabilities,
  TrCatalogProfileId,
} from "@/lib/tr/catalogProfiles/types";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

const FASHION_CAPABILITIES: TrCatalogProfileCapabilities = {
  showProductsNav: true,
  showStockNav: true,
  allowProductRoutes: true,
  showProductCreateCtas: true,
  showAiCreditsCard: true,
  pdpLayout: "split",
  skipStockValidation: false,
  skipInventoryDecrement: false,
  productTypes: ["simple", "advanced", "fashion"],
};

const CUSTOM_ART_CAPABILITIES: TrCatalogProfileCapabilities = {
  showProductsNav: false,
  showStockNav: false,
  allowProductRoutes: false,
  showProductCreateCtas: false,
  showAiCreditsCard: false,
  pdpLayout: "custom_art",
  skipStockValidation: true,
  skipInventoryDecrement: true,
  productTypes: [],
};

const CAPABILITIES: Record<TrCatalogProfileId, TrCatalogProfileCapabilities> = {
  fashion: FASHION_CAPABILITIES,
  custom_art: CUSTOM_ART_CAPABILITIES,
};

export function normalizeCatalogProfile(
  value: string | null | undefined,
): TrCatalogProfileId {
  return value === "custom_art" ? "custom_art" : "fashion";
}

export function resolveCatalogProfile(
  boutique:
    | Pick<TrBoutiquePublic, "catalogProfile">
    | { catalogProfile?: TrCatalogProfileId }
    | null
    | undefined,
): TrCatalogProfileId {
  return normalizeCatalogProfile(boutique?.catalogProfile);
}

export function isCustomArtCatalogProfile(
  boutique:
    | Pick<TrBoutiquePublic, "catalogProfile">
    | { catalogProfile?: TrCatalogProfileId }
    | null
    | undefined,
): boolean {
  return resolveCatalogProfile(boutique) === "custom_art";
}

export function catalogProfileCapabilities(
  profile: TrCatalogProfileId,
): TrCatalogProfileCapabilities {
  return CAPABILITIES[profile];
}
