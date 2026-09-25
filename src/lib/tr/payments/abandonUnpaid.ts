import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { restoreInventoryForOrderLines } from "@/lib/tr/inventory";
import { inventoryLinesOf } from "@/lib/tr/commerce/inventoryLines";
import {
  getOrderByIdAdmin,
  markOrderFailedIfPendingAdmin,
} from "@/lib/tr/orders";
import type { TrOrderWithItems } from "@/types/tr-marketplace";

/** Unpaid iyzico Checkout Form holds older than this are released (stock back). */
export const IYZICO_UNPAID_HOLD_MAX_AGE_MS = 30 * 60 * 1000;

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
    await restoreInventoryForOrderLines(inventoryLinesOf(order.items));
  } catch (error) {
    console.error("[tr/payments] restore after unpaid iyzico failed:", error);
  }
}

/**
 * Browser-back / closed iyzico tab can skip the callback. Release leftover
 * pending holds so size stock is not stuck.
 */
export async function abandonStaleIyzicoHolds(
  boutiqueId: string,
): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) return;

  const cutoff = new Date(Date.now() - IYZICO_UNPAID_HOLD_MAX_AGE_MS).toISOString();
  const { data: itemRows, error: itemsError } = await supabase
    .from("tr_order_items")
    .select("order_id")
    .eq("boutique_id", boutiqueId);

  if (itemsError) {
    console.error("[tr/payments] stale hold item lookup failed:", itemsError.message);
    return;
  }

  const orderIds = [
    ...new Set((itemRows ?? []).map((row) => row.order_id as string)),
  ];
  if (orderIds.length === 0) return;

  const { data: orderRows, error: ordersError } = await supabase
    .from("tr_orders")
    .select("id")
    .in("id", orderIds)
    .eq("payment_status", "pending")
    .eq("is_sandbox", false)
    .lt("created_at", cutoff)
    .limit(25);

  if (ordersError) {
    console.error("[tr/payments] stale hold order lookup failed:", ordersError.message);
    return;
  }

  for (const row of orderRows ?? []) {
    try {
      const order = await getOrderByIdAdmin(row.id as string);
      if (!order) continue;
      await abandonUnpaidIyzicoOrder(order);
    } catch (error) {
      console.error("[tr/payments] stale iyzico hold abandon failed:", error);
    }
  }
}
