import { listPublicAvailableProducts } from "@/lib/tr/products";

/** Platform-wide TR marketplace checkout — not per-boutique. */
export function isTrCheckoutEnabled(): boolean {
  return process.env.TR_CHECKOUT_ENABLED?.trim().toLowerCase() === "true";
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
