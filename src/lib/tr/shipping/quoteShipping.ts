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

function lineQuantity(item: unknown): number {
  if (!item || typeof item !== "object" || !("quantity" in item)) return 1;
  const raw = (item as { quantity?: unknown }).quantity;
  const qty = typeof raw === "number" && Number.isFinite(raw) ? raw : 1;
  return Math.max(1, Math.floor(qty));
}

/** Quantity sum. Boutique cart rows have no `quantity` and count as 1. */
export function shippingItemCount(items: ReadonlyArray<unknown>): number {
  return items.reduce<number>((sum, item) => sum + lineQuantity(item), 0);
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
