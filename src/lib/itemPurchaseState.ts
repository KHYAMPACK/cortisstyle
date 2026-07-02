import type { ClothingItem } from "@/types/item";

export type ItemPurchaseState = "shoppable" | "editorial" | "alternative-only";

function hasPurchaseUrl(url: string | undefined): boolean {
  return typeof url === "string" && url.trim().length > 0;
}

export function resolveItemPurchaseState(
  item: Pick<ClothingItem, "shopUrl" | "budgetAlternativeUrl">,
): ItemPurchaseState {
  const hasShop = hasPurchaseUrl(item.shopUrl);
  const hasAlt = hasPurchaseUrl(item.budgetAlternativeUrl);

  if (!hasShop && !hasAlt) return "editorial";
  if (!hasShop && hasAlt) return "alternative-only";
  return "shoppable";
}

export function itemDisplayTitle(
  item: Pick<ClothingItem, "name" | "displayModel">,
): string {
  return (item.displayModel ?? item.name).trim() || item.name;
}
