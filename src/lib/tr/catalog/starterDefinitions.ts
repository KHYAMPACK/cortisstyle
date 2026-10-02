import type { TrCatalogProfileId } from "@/lib/tr/catalogProfiles";
import { seedFashionCategories } from "@/lib/tr/fashion/seedCategories";
import { seedFashionKinds } from "@/lib/tr/fashion/seedKinds";

/**
 * The definitions a new boutique starts with, by catalog profile: its category tree and
 * its product kinds with their fields. Every storefront and panel reads the boutique's
 * own rows, so creation gives it its profile's starter set (and the panel offers the
 * same through "Hazır … içe aktar"). Core code calls this, not a vertical module
 * directly. Server only.
 */
/** What importing starter kinds did. */
export interface KindImportResult {
  kinds: number;
  attributes: number;
  assigned: number;
}

interface Starter {
  categories?: (boutiqueId: string) => Promise<unknown>;
  kinds?: (boutiqueId: string) => Promise<KindImportResult>;
}

const STARTERS: Partial<Record<TrCatalogProfileId, Starter>> = {
  fashion: { categories: seedFashionCategories, kinds: seedFashionKinds },
};

/** Whether the profile has starter kinds to offer ("Hazır türleri içe aktar"). */
export function hasStarterKinds(profile: TrCatalogProfileId): boolean {
  return Boolean(STARTERS[profile]?.kinds);
}

/**
 * Seeds the profile's starter kinds and fields (only those the boutique lacks) and files
 * products without a kind; all zeros for a profile without any.
 */
export async function seedStarterKinds(
  boutiqueId: string,
  profile: TrCatalogProfileId,
): Promise<KindImportResult> {
  return (
    (await STARTERS[profile]?.kinds?.(boutiqueId)) ?? { kinds: 0, attributes: 0, assigned: 0 }
  );
}

/**
 * Seeds a new boutique: categories first (kinds point at their suggested category),
 * then kinds, which also files the boutique's products under them.
 */
export async function seedStarterDefinitions(
  boutiqueId: string,
  profile: TrCatalogProfileId,
): Promise<void> {
  await STARTERS[profile]?.categories?.(boutiqueId);
  try {
    await seedStarterKinds(boutiqueId, profile);
  } catch (error) {
    // Never fail store creation over kinds (e.g. patch_product_kinds.sql not applied
    // yet): the owner can still run "Hazır türleri içe aktar" later.
    console.warn("[tr/starterDefinitions] starter kinds not seeded", error);
  }
}
