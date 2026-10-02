import type { TrCatalogProfileId } from "@/lib/tr/catalogProfiles";
import { seedFashionCategories } from "@/lib/tr/fashion/seedCategories";

/**
 * The category tree a new boutique starts with, by catalog profile. Every storefront and
 * panel reads the boutique's own categories, so a boutique without any has an empty menu;
 * creation gives it its profile's starter set. Core code (store creation) calls this, not
 * a vertical module directly. Server only.
 */
const STARTERS: Partial<
  Record<TrCatalogProfileId, (boutiqueId: string) => Promise<unknown>>
> = {
  fashion: seedFashionCategories,
};

/** Seeds the profile's starter categories; a no-op for a profile without any. */
export async function seedStarterCategories(
  boutiqueId: string,
  profile: TrCatalogProfileId,
): Promise<void> {
  await STARTERS[profile]?.(boutiqueId);
}
