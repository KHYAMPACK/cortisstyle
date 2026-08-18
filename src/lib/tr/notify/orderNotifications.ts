import type { TrOrder } from "@/types/tr-marketplace";

export const ORDERS_SEEN_EVENT = "tr-panel-orders-seen";

function storageKey(boutiqueId: string): string {
  return `tr-panel-orders-seen:${boutiqueId}`;
}

/** Orders that should surface in owner alerts. Unpaid card holds stay hidden. */
export function isActionableOwnerOrder(
  order: Pick<TrOrder, "paymentStatus" | "isSandbox" | "fulfillmentStatus">,
  options?: { cardCheckout?: boolean },
): boolean {
  if (order.fulfillmentStatus === "cancelled") return false;
  if (
    options?.cardCheckout &&
    !order.isSandbox &&
    (order.paymentStatus === "pending" || order.paymentStatus === "failed")
  ) {
    return false;
  }
  return (
    order.isSandbox ||
    order.paymentStatus === "paid" ||
    order.paymentStatus === "sandbox" ||
    order.paymentStatus === "pending"
  );
}

export function isOwnerListedOrder(
  order: Pick<TrOrder, "paymentStatus" | "isSandbox" | "fulfillmentStatus">,
  options?: { cardCheckout?: boolean },
): boolean {
  return isActionableOwnerOrder(order, options);
}

/** @deprecated Prefer isActionableOwnerOrder — name kept for older imports. */
export function isPaidLikeOrder(
  order: Pick<TrOrder, "paymentStatus" | "isSandbox" | "fulfillmentStatus">,
): boolean {
  return isActionableOwnerOrder(order);
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
 * New-order alert: unpaid-attention pipeline, or any actionable order newer than last visit.
 */
export function hasUnseenOrders(
  orders: Array<
    Pick<
      TrOrder,
      "createdAt" | "paymentStatus" | "isSandbox" | "fulfillmentStatus"
    >
  >,
  seenAt: string | null,
  options?: { cardCheckout?: boolean },
): boolean {
  const actionable = orders.filter((order) =>
    isActionableOwnerOrder(order, options),
  );
  if (actionable.length === 0) return false;

  if (!seenAt) {
    return actionable.some(
      (order) =>
        order.fulfillmentStatus === "created" ||
        order.fulfillmentStatus === "ready",
    );
  }

  return actionable.some((order) => order.createdAt > seenAt);
}
