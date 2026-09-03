import type { TrProduct, TrProductFeatures } from "@/types/tr-marketplace";

export function readSizePricesKurus(
  features: TrProductFeatures | null | undefined,
): Record<string, number> {
  const raw = features?.sizePricesKurus;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "number" && value > 0) {
      out[key.trim()] = Math.floor(value);
    }
  }
  return out;
}

export function resolveCustomArtPriceKurus(
  product: Pick<TrProduct, "priceKurus" | "features" | "sizes">,
  size: string | null | undefined,
): number | null {
  const normalized = size?.trim() ?? "";
  if (!normalized) return null;
  const prices = readSizePricesKurus(product.features);
  const matchKey = Object.keys(prices).find(
    (entry) => entry.toLocaleUpperCase("en") === normalized.toLocaleUpperCase("en"),
  );
  if (matchKey) return prices[matchKey]!;
  if (product.sizes.length === 0) return product.priceKurus;
  return null;
}

export function isMadeToOrderProduct(
  features: TrProductFeatures | null | undefined,
): boolean {
  return features?.madeToOrder === true;
}

export function customArtFromPriceLabel(
  product: Pick<TrProduct, "priceKurus" | "features">,
): string {
  const prices = Object.values(readSizePricesKurus(product.features));
  const min =
    prices.length > 0 ? Math.min(...prices) : product.priceKurus;
  return min > 0 ? String(min) : String(product.priceKurus);
}
