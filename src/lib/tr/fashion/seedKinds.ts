import { importKindTemplate } from "@/lib/tr/catalog/productKinds";
import { fashionKindKeyForCategory, fashionKindTemplate } from "@/lib/tr/fashion/kindTemplate";

/**
 * Give a fashion boutique the starter kinds and fields ("Hazır türleri içe aktar", and
 * at store creation), then give each product without a kind the one its category maps
 * to (through the categories' system keys). Only what the boutique lacks is created, so
 * running it again is harmless. Server only.
 */
export async function seedFashionKinds(boutiqueId: string) {
  return importKindTemplate(boutiqueId, fashionKindTemplate(), fashionKindKeyForCategory);
}
