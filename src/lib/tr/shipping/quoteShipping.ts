import { boutiqueHasLiveShipping } from "@/lib/tr/shipping/registry";
import {
  CHECKOUT_SHIPPING_HANDLER,
  FLAT_SHIPPING_FEE_KURUS,
  FREE_SHIPPING_MIN_ITEMS,
} from "@/lib/tr/shipping/types";

export type CheckoutShippingQuote = {
  feeKurus: number;
  handlerCode: typeof CHECKOUT_SHIPPING_HANDLER;
};

/** Quantity sum across checkout / cart lines (qty defaults to 1). */
export function shippingItemCount(
  items: Array<{ quantity?: number }>,
): number {
  return items.reduce(
    (sum, item) => sum + Math.max(1, Math.floor(item.quantity ?? 1)),
    0,
  );
}

/**
 * Flat kargo for live boutiques, free at FREE_SHIPPING_MIN_ITEMS.
 * Not a Basit live quote — client cannot set this.
 */
export function quoteCheckoutShippingFee(
  boutiqueSlug: string,
  itemCount: number,
): CheckoutShippingQuote | null {
  if (!boutiqueHasLiveShipping(boutiqueSlug)) return null;
  const count = Number.isFinite(itemCount) ? Math.max(0, Math.floor(itemCount)) : 0;
  return {
    feeKurus:
      count >= FREE_SHIPPING_MIN_ITEMS ? 0 : FLAT_SHIPPING_FEE_KURUS,
    handlerCode: CHECKOUT_SHIPPING_HANDLER,
  };
}
