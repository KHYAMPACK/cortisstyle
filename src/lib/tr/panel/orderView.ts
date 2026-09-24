/**
 * Pure pieces of the owner order page: money breakdown, neighbouring orders for
 * Önceki / Sonraki, and the wording that depends on the order's state.
 */

import type {
  TrFulfillmentStatus,
  TrOrderWithItems,
} from "@/types/tr-marketplace";

type OrderMoney = Pick<TrOrderWithItems, "items" | "totalKurus" | "discountKurus">;

/** Sum of the lines at their list prices, before discount and shipping. */
export function orderSubtotalKurus(order: Pick<TrOrderWithItems, "items">): number {
  return order.items.reduce((sum, item) => sum + item.priceKurus * item.quantity, 0);
}

/**
 * What the shopper paid for shipping. Orders don't keep it as its own number:
 * total = subtotal − discount + shipping, so it is what is left over.
 */
export function orderShippingKurus(order: OrderMoney): number {
  return Math.max(
    0,
    order.totalKurus - (orderSubtotalKurus(order) - order.discountKurus),
  );
}

/** Card payments carry an iyzico payment id; everything else is settled by hand. */
export function orderPaymentMethod(
  order: Pick<TrOrderWithItems, "iyzicoPaymentId">,
): "card" | "manual" {
  return order.iyzicoPaymentId ? "card" : "manual";
}

export function orderUnitCount(order: Pick<TrOrderWithItems, "items">): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

function newestFirst(orders: readonly TrOrderWithItems[]): TrOrderWithItems[] {
  return orders
    .map((order, index) => ({ order, index }))
    .sort(
      (a, b) =>
        Date.parse(b.order.createdAt) - Date.parse(a.order.createdAt) ||
        a.index - b.index,
    )
    .map(({ order }) => order);
}

export interface AdjacentOrders {
  /** The order just above this one in the list (placed after it). */
  newer: TrOrderWithItems | null;
  /** The order just below it (placed before it). */
  older: TrOrderWithItems | null;
  /** 1-based place in the list, or null when the order isn't in it. */
  position: number | null;
  total: number;
}

/** Neighbours of an order in the newest-first list — what Önceki / Sonraki open. */
export function adjacentOrders(
  orders: readonly TrOrderWithItems[],
  orderId: string,
): AdjacentOrders {
  const sorted = newestFirst(orders);
  const index = sorted.findIndex((order) => order.id === orderId);
  if (index < 0) {
    return { newer: null, older: null, position: null, total: sorted.length };
  }
  return {
    newer: sorted[index - 1] ?? null,
    older: sorted[index + 1] ?? null,
    position: index + 1,
    total: sorted.length,
  };
}

/** "N. sipariş": how many orders this customer has placed, counting this one. */
export function customerOrderNumber(
  orders: readonly TrOrderWithItems[],
  order: Pick<TrOrderWithItems, "id" | "customerEmail" | "createdAt">,
): number {
  const email = order.customerEmail.trim().toLowerCase();
  const placed = Date.parse(order.createdAt);
  const count = orders.filter(
    (other) =>
      other.paymentStatus !== "failed" &&
      other.customerEmail.trim().toLowerCase() === email &&
      (other.id === order.id || Date.parse(other.createdAt) < placed),
  ).length;
  return Math.max(1, count);
}

const FULFILLMENT_CARD_TITLE: Record<TrFulfillmentStatus, string> = {
  created: "Gönderilmeyen",
  ready: "Kargoya hazır",
  shipped: "Kargoda",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
};

/** Heading of the products card: what state they are in and how many pieces. */
export function fulfillmentCardTitle(
  status: TrFulfillmentStatus,
  unitCount: number,
): string {
  return `${FULFILLMENT_CARD_TITLE[status]} (${unitCount} ürün)`;
}
