import { catalogProfileCapabilities } from "@/lib/tr/catalogProfiles";
import type { TrCatalogProfileId } from "@/lib/tr/catalogProfiles";
import {
  trPanelNewAdvancedProductPath,
  trPanelNewFashionProductPath,
  trPanelNewSimpleProductPath,
} from "@/lib/tr/paths";
import type { TrProductType } from "@/types/tr-marketplace";

/**
 * The product types an owner can create. Which of them a boutique is offered is a
 * capability of its vertical (`catalogProfileCapabilities(profile).productTypes`).
 *
 * Core only knows the `fashion` id and its route; the garment flows behind it live in
 * `src/components/tr/fashion/`.
 */
export interface TrProductTypeDefinition {
  id: TrProductType;
  label: string;
  description: string;
  /** Where "create one of these" starts. */
  createPath: string;
  /**
   * Offered to staff only. Gelişmiş ürün is built and saves variants, but the shop cannot
   * sell them yet (a shopper can't pick a variant), so an owner is not offered it until
   * the storefront can. Remove the flag then.
   */
  staffOnly?: boolean;
}

const DEFINITIONS: Partial<Record<TrProductType, TrProductTypeDefinition>> = {
  simple: {
    id: "simple",
    label: "Basit ürün",
    description:
      "Tek fiyat ve tek stok. Beden veya renk seçeneği olmayan ürünler için.",
    createPath: trPanelNewSimpleProductPath(),
  },
  advanced: {
    id: "advanced",
    label: "Gelişmiş ürün",
    description:
      "Basit ürün artı varyantlar: renk, beden gibi seçeneklerin her kombinasyonu için ayrı fiyat, SKU ve stok.",
    createPath: trPanelNewAdvancedProductPath(),
    staffOnly: true,
  },
  fashion: {
    id: "fashion",
    label: "Moda ürünü",
    description:
      "Giyim için özel akış: fotoğraftan katalog, beden tablosu, takım ve toplu ekleme.",
    createPath: trPanelNewFashionProductPath(),
  },
};

export function productTypeLabel(id: TrProductType | undefined): string {
  return DEFINITIONS[id ?? "fashion"]?.label ?? "Ürün";
}

/** The types this vertical offers, in chooser order (staff-only ones only for staff). */
export function productTypesForProfile(
  profile: TrCatalogProfileId,
  options: { isStaff?: boolean } = {},
): TrProductTypeDefinition[] {
  return catalogProfileCapabilities(profile)
    .productTypes.map((id) => DEFINITIONS[id])
    .filter((entry): entry is TrProductTypeDefinition => Boolean(entry))
    .filter((entry) => !entry.staffOnly || options.isStaff === true);
}
