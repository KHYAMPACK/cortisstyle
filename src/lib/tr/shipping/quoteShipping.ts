import { boutiqueHasLiveShipping } from "@/lib/tr/shipping/registry";
import {
  CHECKOUT_SHIPPING_HANDLER,
  FLAT_SHIPPING_FEE_KURUS,
} from "@/lib/tr/shipping/types";

export type CheckoutShippingQuote = {
  feeKurus: number;
  handlerCode: typeof CHECKOUT_SHIPPING_HANDLER;
};

/** Flat kargo for live boutiques. Not a Basit live quote — client cannot set this. */
export function quoteCheckoutShippingFee(
  boutiqueSlug: string,
): CheckoutShippingQuote | null {
  if (!boutiqueHasLiveShipping(boutiqueSlug)) return null;
  return {
    feeKurus: FLAT_SHIPPING_FEE_KURUS,
    handlerCode: CHECKOUT_SHIPPING_HANDLER,
  };
}
