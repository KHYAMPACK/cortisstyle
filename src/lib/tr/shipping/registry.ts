import type { TrShippingProviderId } from "@/types/tr-marketplace";

export type { TrShippingProviderId };

/**
 * Per-boutique carrier. Cortisstyle is not the shipper.
 * Missing slug → manual stub (Pervin / clones).
 */
const SHIPPING_BY_SLUG: Partial<Record<string, TrShippingProviderId>> = {
  lilabutik: "basitkargo",
};

export function getShippingProviderId(
  boutiqueSlug: string,
): TrShippingProviderId | null {
  const slug = boutiqueSlug.trim().toLowerCase();
  return SHIPPING_BY_SLUG[slug] ?? null;
}

export function boutiqueHasLiveShipping(boutiqueSlug: string): boolean {
  return getShippingProviderId(boutiqueSlug) !== null;
}
