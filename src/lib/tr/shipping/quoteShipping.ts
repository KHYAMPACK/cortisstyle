import type { TrBoutiquePublic } from "@/types/tr-marketplace";

/**
 * A boutique's shopper-facing shipping fee rules (DB: tr_boutiques.shipping_fee_kurus,
 * free_shipping_min_items, free_shipping_min_subtotal_kurus). Independent of any
 * carrier integration — see registry.ts for that.
 */
export type ShippingFeeConfig = {
  /** Flat fee per order in kuruş. 0 = no shipping charge at all. */
  feeKurus: number;
  /** Orders with at least this many items ship free. */
  freeMinItems: number | null;
  /** Orders whose items subtotal (before discounts) reaches this ship free. */
  freeMinSubtotalKurus: number | null;
};

export const NO_SHIPPING_FEE: ShippingFeeConfig = {
  feeKurus: 0,
  freeMinItems: null,
  freeMinSubtotalKurus: null,
};

export type CheckoutShippingQuote = {
  feeKurus: number;
};

/** Cart or checkout line. Boutique cart rows have no `quantity` and count as 1. */
export type ShippingQuoteItem = {
  priceKurus?: number | null;
  quantity?: number;
};

export type FreeShippingProgress = {
  free: boolean;
  unit: "items" | "amount";
  /** Items in the cart, or items subtotal in kuruş, depending on `unit`. */
  current: number;
  needed: number;
  remaining: number;
  /** The fee that applies while `free` is false. */
  feeKurus: number;
};

function wholeNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.floor(value)
    : null;
}

export function shippingFeeConfigOf(
  boutique: Partial<
    Pick<
      TrBoutiquePublic,
      "shippingFeeKurus" | "freeShippingMinItems" | "freeShippingMinSubtotalKurus"
    >
  >,
): ShippingFeeConfig {
  return {
    feeKurus: Math.max(0, wholeNumberOrNull(boutique.shippingFeeKurus) ?? 0),
    freeMinItems: wholeNumberOrNull(boutique.freeShippingMinItems),
    freeMinSubtotalKurus: wholeNumberOrNull(boutique.freeShippingMinSubtotalKurus),
  };
}

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

/** Items subtotal in kuruş, before discounts. */
export function shippingSubtotalKurus(
  items: ReadonlyArray<ShippingQuoteItem>,
): number {
  return items.reduce<number>((sum, item) => {
    const price =
      typeof item.priceKurus === "number" && Number.isFinite(item.priceKurus)
        ? Math.max(0, Math.floor(item.priceKurus))
        : 0;
    return sum + price * lineQuantity(item);
  }, 0);
}

/**
 * Progress toward free shipping. Null when there is nothing to show: no fee is
 * charged, or the fee always applies because no free threshold is configured.
 */
export function freeShippingProgress(
  config: ShippingFeeConfig,
  items: ReadonlyArray<ShippingQuoteItem>,
): FreeShippingProgress | null {
  if (config.feeKurus <= 0) return null;

  if (config.freeMinItems !== null) {
    const current = shippingItemCount(items);
    const needed = config.freeMinItems;
    return {
      free: current >= needed,
      unit: "items",
      current,
      needed,
      remaining: Math.max(0, needed - current),
      feeKurus: config.feeKurus,
    };
  }

  if (config.freeMinSubtotalKurus !== null) {
    const current = shippingSubtotalKurus(items);
    const needed = config.freeMinSubtotalKurus;
    return {
      free: current >= needed,
      unit: "amount",
      current,
      needed,
      remaining: Math.max(0, needed - current),
      feeKurus: config.feeKurus,
    };
  }

  return null;
}

/**
 * The fee a shopper is charged for this cart. Null when the boutique charges no
 * shipping. The server is the only source of this number — the client cannot set it.
 */
export function quoteCheckoutShippingFee(
  config: ShippingFeeConfig,
  items: ReadonlyArray<ShippingQuoteItem>,
): CheckoutShippingQuote | null {
  if (config.feeKurus <= 0) return null;
  const progress = freeShippingProgress(config, items);
  return { feeKurus: progress?.free ? 0 : config.feeKurus };
}
