import type { TrOrderItem } from "@/types/tr-marketplace";

/**
 * The option an order line was bought with, as the screens show it: a Gelişmiş ürün's
 * variant ("Varyant: Kırmızı / S") or, for other products, the size ("Beden: M").
 * Null when the line has neither. Client-safe.
 */
export function orderItemOption(
  item: Pick<TrOrderItem, "size" | "variantLabel">,
): { label: string; value: string } | null {
  if (item.variantLabel) return { label: "Varyant", value: item.variantLabel };
  if (item.size) return { label: "Beden", value: item.size };
  return null;
}
