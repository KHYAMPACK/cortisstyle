/**
 * Order money rules shared by the owner summary and the dashboard, kept free of
 * server imports so they can be unit-tested. Changing these changes the revenue
 * every owner sees — keep both consumers on this one definition.
 */

interface RevenueOrder {
  items: Array<{
    boutiqueId: string;
    priceKurus: number;
    quantity: number;
  }>;
  discountKurus: number;
}

/** Shipped, or about to be: not cancelled, and paid for (card) or a test order. */
export function isActiveOrder(order: {
  fulfillmentStatus: string;
  paymentStatus: string;
}): boolean {
  if (order.fulfillmentStatus === "cancelled") return false;
  if (order.paymentStatus === "pending" || order.paymentStatus === "failed") {
    return false;
  }
  return order.paymentStatus === "paid" || order.paymentStatus === "sandbox";
}

/**
 * What this boutique earned from an order: its own lines, minus its proportional
 * share of the order-level discount. Shipping fees are not product revenue.
 */
export function boutiqueLineRevenue(
  order: RevenueOrder,
  boutiqueId: string,
): number {
  const lines = order.items.filter((item) => item.boutiqueId === boutiqueId);
  const subtotal = lines.reduce(
    (sum, item) => sum + item.priceKurus * item.quantity,
    0,
  );
  if (subtotal <= 0) return 0;
  const orderSubtotal = order.items.reduce(
    (sum, item) => sum + item.priceKurus * item.quantity,
    0,
  );
  if (orderSubtotal <= 0) return subtotal;
  const share = subtotal / orderSubtotal;
  return Math.max(0, Math.round(subtotal - order.discountKurus * share));
}
