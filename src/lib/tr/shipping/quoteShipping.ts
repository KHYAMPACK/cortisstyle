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

export type ShippingQuoteItem = {
  title?: string | null;
  quantity?: number;
  features?: { color?: string | null };
  colors?: Array<{ name?: string | null }>;
};

export type FreeShippingProgress = {
  free: boolean;
  current: number;
  needed: number;
  remaining: number;
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

export function freeShippingProgress(
  itemCount: number,
  items?: ReadonlyArray<ShippingQuoteItem>,
): FreeShippingProgress {
  const count = items
    ? shippingItemCount(items)
    : Number.isFinite(itemCount)
      ? Math.max(0, Math.floor(itemCount))
      : 0;
  if (count >= FREE_SHIPPING_MIN_ITEMS) {
    return {
      free: true,
      current: count,
      needed: FREE_SHIPPING_MIN_ITEMS,
      remaining: 0,
    };
  }
  return {
    free: false,
    current: count,
    needed: FREE_SHIPPING_MIN_ITEMS,
    remaining: Math.max(0, FREE_SHIPPING_MIN_ITEMS - count),
  };
}

/**
 * Flat kargo for live boutiques.
 * Free at FREE_SHIPPING_MIN_ITEMS.
 * Not a Basit live quote — client cannot set this.
 */
export function quoteCheckoutShippingFee(
  boutiqueSlug: string,
  itemCount: number,
  items?: ReadonlyArray<ShippingQuoteItem>,
): CheckoutShippingQuote | null {
  if (!boutiqueHasLiveShipping(boutiqueSlug)) return null;
  const progress = freeShippingProgress(itemCount, items);
  return {
    feeKurus: progress.free ? 0 : FLAT_SHIPPING_FEE_KURUS,
    handlerCode: CHECKOUT_SHIPPING_HANDLER,
  };
}
