import { catalogProfileCapabilities } from "@/lib/tr/catalogProfiles";
import type { TrCatalogProfileId } from "@/lib/tr/catalogProfiles";
import {
  trPanelNewFashionProductPath,
  trPanelNewSimpleProductPath,
} from "@/lib/tr/paths";
import type { TrProductType } from "@/types/tr-marketplace";

/**
 * The product types an owner can create. Which of them a boutique is offered is a
 * capability of its vertical (`catalogProfileCapabilities(profile).productTypes`).
 *
 * `advanced` (Basit + variants) joins this list when its editor exists. Core only
 * knows the `fashion` id and its route; the garment flows behind it live in
 * `src/components/tr/fashion/`.
 */
export interface TrProductTypeDefinition {
  id: TrProductType;
  label: string;
  description: string;
  /** Where "create one of these" starts. */
  createPath: string;
}

const DEFINITIONS: Partial<Record<TrProductType, TrProductTypeDefinition>> = {
  simple: {
    id: "simple",
    label: "Basit ürün",
    description:
      "Tek fiyat ve tek stok. Beden veya renk seçeneği olmayan ürünler için.",
    createPath: trPanelNewSimpleProductPath(),
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

/** The types this vertical offers, in chooser order. */
export function productTypesForProfile(
  profile: TrCatalogProfileId,
): TrProductTypeDefinition[] {
  return catalogProfileCapabilities(profile)
    .productTypes.map((id) => DEFINITIONS[id])
    .filter((entry): entry is TrProductTypeDefinition => Boolean(entry));
}
