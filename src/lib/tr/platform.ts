import { listPublicAvailableProducts } from "@/lib/tr/products";

/**
 * Platform-wide TR marketplace checkout — not per-boutique.
 * Uses NEXT_PUBLIC_ so Client Component SSR and hydration see the same value
 * (`next.config.ts` mirrors `TR_CHECKOUT_ENABLED` when the public var is unset).
 */
export function isTrCheckoutEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_TR_CHECKOUT_ENABLED?.trim().toLowerCase() === "true"
  );
}

/** Live catalog empty → full icon / store / cart demo UX. */
export async function isTrDemoCatalogActive(): Promise<boolean> {
  try {
    const products = await listPublicAvailableProducts();
    return products.filter((p) => p.status === "available").length === 0;
  } catch {
    return true;
  }
}

/** Cart + purchase chrome for real checkout OR empty-catalog demo. */
export async function isTrMarketplaceCartEnabled(): Promise<boolean> {
  if (isTrCheckoutEnabled()) return true;
  return isTrDemoCatalogActive();
}
