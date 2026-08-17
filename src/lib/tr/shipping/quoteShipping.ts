import {
  basitKargoQuotePackageFees,
  getBasitKargoTokenForSlug,
} from "@/lib/tr/shipping/providers/basitKargo";
import { boutiqueHasLiveShipping } from "@/lib/tr/shipping/registry";
import { CHECKOUT_SHIPPING_HANDLER } from "@/lib/tr/shipping/types";

export type CheckoutShippingQuote = {
  feeKurus: number;
  handlerCode: typeof CHECKOUT_SHIPPING_HANDLER;
};

const QUOTE_TTL_MS = 10 * 60 * 1000;
const quoteCache = new Map<string, { at: number; quote: CheckoutShippingQuote }>();

export async function quoteCheckoutShippingFee(
  boutiqueSlug: string,
): Promise<CheckoutShippingQuote | null> {
  const slug = boutiqueSlug.trim().toLowerCase();
  if (!boutiqueHasLiveShipping(slug)) return null;

  const cached = quoteCache.get(slug);
  if (cached && Date.now() - cached.at < QUOTE_TTL_MS) {
    return cached.quote;
  }

  const token = getBasitKargoTokenForSlug(slug);
  if (!token) {
    throw new Error("Kargo ücreti alınamadı. Daha sonra tekrar deneyin.");
  }

  const rates = await basitKargoQuotePackageFees(token);
  const cheapest = rates[0];
  if (!cheapest) {
    throw new Error("Bu paket için kargo ücreti bulunamadı.");
  }

  const quote: CheckoutShippingQuote = {
    feeKurus: cheapest.feeKurus,
    handlerCode: CHECKOUT_SHIPPING_HANDLER,
  };
  quoteCache.set(slug, { at: Date.now(), quote });
  return quote;
}
