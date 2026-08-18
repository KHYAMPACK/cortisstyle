import { restoreInventoryForOrderLines } from "@/lib/tr/inventory";
import {
  markOrderFailedIfPendingAdmin,
} from "@/lib/tr/orders";
import type { TrOrderWithItems } from "@/types/tr-marketplace";

function inventoryLines(order: TrOrderWithItems) {
  return order.items
    .filter((item) => item.productId)
    .map((item) => ({
      productId: item.productId as string,
      size: item.size,
      quantity: item.quantity,
    }));
}

/**
 * iyzico cancel/fail: drop the unpaid hold so it never becomes a panel sipariş,
 * and put size stock back.
 */
export async function abandonUnpaidIyzicoOrder(
  order: TrOrderWithItems,
): Promise<void> {
  if (order.isSandbox) return;
  if (order.paymentStatus !== "pending") return;

  const marked = await markOrderFailedIfPendingAdmin(order.id);
  if (!marked) return;

  try {
    await restoreInventoryForOrderLines(inventoryLines(order));
  } catch (error) {
    console.error("[tr/payments] restore after unpaid iyzico failed:", error);
  }
}
