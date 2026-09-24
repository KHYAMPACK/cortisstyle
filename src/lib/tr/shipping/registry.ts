import type { TrShippingProviderId } from "@/types/tr-marketplace";

export type { TrShippingProviderId };

/**
 * Per-boutique carrier integration (label purchase, tracking, webhook). Cortisstyle
 * is not the shipper. Missing slug → manual tracking. This is NOT the fee a shopper
 * pays — that is per-boutique DB config, see quoteShipping.ts.
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

export function boutiqueHasCarrierIntegration(boutiqueSlug: string): boolean {
  return getShippingProviderId(boutiqueSlug) !== null;
}
