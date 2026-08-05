import type { TrOrder } from "@/types/tr-marketplace";

export const ORDERS_SEEN_EVENT = "tr-panel-orders-seen";

function storageKey(boutiqueId: string): string {
  return `tr-panel-orders-seen:${boutiqueId}`;
}

export function isPaidLikeOrder(
  order: Pick<TrOrder, "paymentStatus" | "isSandbox">,
): boolean {
  return (
    order.isSandbox ||
    order.paymentStatus === "paid" ||
    order.paymentStatus === "sandbox"
  );
}

export function getOrdersSeenAt(boutiqueId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(storageKey(boutiqueId));
  } catch {
    return null;
  }
}

/** Call when the owner opens Siparişler so the nav dot clears. */
export function markOrdersSeen(boutiqueId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey(boutiqueId),
      new Date().toISOString(),
    );
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent(ORDERS_SEEN_EVENT, { detail: { boutiqueId } }),
  );
}

/**
 * New-order alert: unpaid-attention pipeline, or any paid order newer than last visit.
 */
export function hasUnseenOrders(
  orders: Array<
    Pick<
      TrOrder,
      "createdAt" | "paymentStatus" | "isSandbox" | "fulfillmentStatus"
    >
  >,
  seenAt: string | null,
): boolean {
  const paid = orders.filter(isPaidLikeOrder);
  if (paid.length === 0) return false;

  if (!seenAt) {
    return paid.some(
      (order) =>
        order.fulfillmentStatus === "created" ||
        order.fulfillmentStatus === "ready",
    );
  }

  return paid.some((order) => order.createdAt > seenAt);
}
