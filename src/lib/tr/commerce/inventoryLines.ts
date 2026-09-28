import type { TrOrderItem } from "@/types/tr-marketplace";

/**
 * One line of stock to take or give back. Pure — the database work is in `inventory.ts`.
 */
export type InventoryLine = {
  productId: string;
  size: string | null;
  quantity: number;
  /**
   * Set for a line that was sold as a variant of a Gelişmiş product. `id` is null when
   * the variant row was removed after the order: there is nothing left to give stock back to.
   */
  variant?: { id: string | null };
};

/** The stock line of an order item, or null when its product was deleted. */
export function inventoryLineOf(
  item: Pick<
    TrOrderItem,
    "productId" | "size" | "quantity" | "variantId" | "variantLabel"
  >,
): InventoryLine | null {
  if (!item.productId) return null;
  return {
    productId: item.productId,
    size: item.size,
    quantity: item.quantity,
    ...(item.variantId || item.variantLabel
      ? { variant: { id: item.variantId } }
      : {}),
  };
}

export function inventoryLinesOf(
  items: ReadonlyArray<Parameters<typeof inventoryLineOf>[0]>,
): InventoryLine[] {
  return items.flatMap((item) => inventoryLineOf(item) ?? []);
}
