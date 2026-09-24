/**
 * Everything the panel home dashboard shows, computed from one boutique's orders
 * and products in a single pass. Pure — no I/O — so the definitions below are
 * covered by tests and can be swapped for SQL aggregation later without touching
 * the UI.
 *
 * Definitions (change them here, once):
 * - Revenue / orders count only orders that are PAID and not cancelled. Test
 *   (sandbox) orders and unpaid orders never count. Revenue is the boutique's own
 *   line total minus its share of the order discount; shipping fees are excluded.
 * - A "customer" is a lower-cased email. A customer is NEW in a window when their
 *   first paid order overall falls inside it.
 * - "İptal" is an order that was paid and then cancelled (money to refund).
 * - Payment completion only exists for boutiques that offer card payment:
 *   card-paid orders ÷ (card-paid + failed + still-pending checkouts).
 */

import type { TrOrderWithItems, TrProduct } from "@/types/tr-marketplace";
import {
  bucketIndexFor,
  bucketLabel,
  bucketStarts,
  type TrDashboardBucket,
  type TrDashboardRangeId,
  type TrDashboardWindow,
} from "@/lib/tr/panel/dashboardRange";
import {
  boutiqueLineRevenue,
  isActiveOrder,
} from "@/lib/tr/panel/orderRevenue";

export interface TrDashboardKpis {
  revenueKurus: number;
  orderCount: number;
  itemCount: number;
  averageOrderKurus: number;
  itemsPerOrder: number;
  averageItemPriceKurus: number;
  newCustomers: number;
  customerCount: number;
  /** Share of this window's customers who had ordered before it. Null with no customers. */
  repeatRate: number | null;
  cancelledCount: number;
  cancelledKurus: number;
  /** Card checkouts started (paid by card + failed + pending). 0 without card payments. */
  paymentAttempts: number;
  /** Null when the boutique has no card payments or there were no attempts. */
  paymentCompletionRate: number | null;
  cardOrderCount: number;
  cardRevenueKurus: number;
  manualOrderCount: number;
  manualRevenueKurus: number;
  discountedOrderCount: number;
  discountKurus: number;
}

export interface TrDashboardSeriesPoint {
  startMs: number;
  label: string;
  revenueKurus: number;
  orderCount: number;
  newCustomers: number;
  cancelledCount: number;
}

export interface TrDashboardTopProduct {
  productId: string | null;
  title: string;
  image: string | null;
  category: string | null;
  quantity: number;
  revenueKurus: number;
  previousRevenueKurus: number;
}

export interface TrDashboardTopCategory {
  category: string | null;
  quantity: number;
  revenueKurus: number;
  previousRevenueKurus: number;
}

export interface TrOwnerDashboard {
  range: {
    id: TrDashboardRangeId;
    label: string;
    startMs: number;
    endMs: number;
    prevStartMs: number;
    prevEndMs: number;
    bucket: TrDashboardBucket;
  };
  offersCardPayments: boolean;
  current: TrDashboardKpis;
  previous: TrDashboardKpis;
  series: TrDashboardSeriesPoint[];
  previousSeries: TrDashboardSeriesPoint[];
  topProducts: TrDashboardTopProduct[];
  topCategories: TrDashboardTopCategory[];
  actions: {
    /** Paid (or test) orders waiting to be shipped. */
    pendingFulfillment: number;
    /** Manual-payment orders waiting for the owner to confirm payment. */
    awaitingPayment: number;
    lowStock: number;
  };
  generatedAt: string;
}

type PreparedStatus = "paid" | "cancelledPaid" | "failed" | "pending" | "ignored";

interface PreparedOrder {
  id: string;
  createdMs: number;
  email: string;
  status: PreparedStatus;
  netKurus: number;
  grossKurus: number;
  itemCount: number;
  discountKurus: number;
  card: boolean;
  lines: Array<{
    productId: string | null;
    title: string;
    quantity: number;
    grossKurus: number;
  }>;
}

const TOP_LIMIT = 5;
const LOW_STOCK_AT_MOST = 2;

function prepareOrders(
  orders: TrOrderWithItems[],
  boutiqueId: string,
): PreparedOrder[] {
  const prepared: PreparedOrder[] = [];

  for (const order of orders) {
    const lines = order.items
      .filter((item) => item.boutiqueId === boutiqueId)
      .map((item) => ({
        productId: item.productId,
        title: item.title,
        quantity: item.quantity,
        grossKurus: item.priceKurus * item.quantity,
      }));
    if (lines.length === 0) continue;

    let status: PreparedStatus = "ignored";
    if (!order.isSandbox && order.paymentStatus !== "sandbox") {
      if (order.paymentStatus === "paid") {
        status =
          order.fulfillmentStatus === "cancelled" ? "cancelledPaid" : "paid";
      } else if (order.paymentStatus === "failed") {
        status = "failed";
      } else if (order.paymentStatus === "pending") {
        status = "pending";
      }
    }

    const email = order.customerEmail.trim().toLowerCase();
    prepared.push({
      id: order.id,
      createdMs: Date.parse(order.createdAt),
      email: email || `order:${order.id}`,
      status,
      netKurus: boutiqueLineRevenue(order, boutiqueId),
      grossKurus: lines.reduce((sum, line) => sum + line.grossKurus, 0),
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      discountKurus: order.discountKurus,
      card: Boolean(order.iyzicoPaymentId),
      lines,
    });
  }

  return prepared;
}

function inWindow(order: PreparedOrder, startMs: number, endMs: number): boolean {
  return order.createdMs >= startMs && order.createdMs < endMs;
}

function computeKpis(
  prepared: PreparedOrder[],
  firstOrderIds: Set<string>,
  startMs: number,
  endMs: number,
  offersCardPayments: boolean,
): TrDashboardKpis {
  const windowOrders = prepared.filter((order) =>
    inWindow(order, startMs, endMs),
  );
  const paid = windowOrders.filter((order) => order.status === "paid");
  const cancelled = windowOrders.filter(
    (order) => order.status === "cancelledPaid",
  );

  const revenueKurus = paid.reduce((sum, order) => sum + order.netKurus, 0);
  const itemCount = paid.reduce((sum, order) => sum + order.itemCount, 0);
  const grossKurus = paid.reduce((sum, order) => sum + order.grossKurus, 0);
  const orderCount = paid.length;

  const customers = new Set(paid.map((order) => order.email));
  const newCustomers = paid.filter((order) =>
    firstOrderIds.has(order.id),
  ).length;

  const cardPaid = paid.filter((order) => order.card);
  const manualPaid = paid.filter((order) => !order.card);
  const discounted = paid.filter((order) => order.discountKurus > 0);

  const paymentAttempts = offersCardPayments
    ? cardPaid.length +
      windowOrders.filter(
        (order) => order.status === "failed" || order.status === "pending",
      ).length
    : 0;

  return {
    revenueKurus,
    orderCount,
    itemCount,
    averageOrderKurus: orderCount > 0 ? Math.round(revenueKurus / orderCount) : 0,
    itemsPerOrder: orderCount > 0 ? itemCount / orderCount : 0,
    averageItemPriceKurus: itemCount > 0 ? Math.round(grossKurus / itemCount) : 0,
    newCustomers,
    customerCount: customers.size,
    repeatRate:
      customers.size > 0 ? (customers.size - newCustomers) / customers.size : null,
    cancelledCount: cancelled.length,
    cancelledKurus: cancelled.reduce((sum, order) => sum + order.netKurus, 0),
    paymentAttempts,
    paymentCompletionRate:
      paymentAttempts > 0 ? cardPaid.length / paymentAttempts : null,
    cardOrderCount: cardPaid.length,
    cardRevenueKurus: cardPaid.reduce((sum, order) => sum + order.netKurus, 0),
    manualOrderCount: manualPaid.length,
    manualRevenueKurus: manualPaid.reduce((sum, order) => sum + order.netKurus, 0),
    discountedOrderCount: discounted.length,
    discountKurus: discounted.reduce((sum, order) => sum + order.discountKurus, 0),
  };
}

function computeSeries(
  prepared: PreparedOrder[],
  firstOrderIds: Set<string>,
  startMs: number,
  endMs: number,
  bucket: TrDashboardBucket,
): TrDashboardSeriesPoint[] {
  const starts = bucketStarts(startMs, endMs, bucket);
  const points: TrDashboardSeriesPoint[] = starts.map((start) => ({
    startMs: start,
    label: bucketLabel(start, bucket),
    revenueKurus: 0,
    orderCount: 0,
    newCustomers: 0,
    cancelledCount: 0,
  }));

  for (const order of prepared) {
    if (order.status !== "paid" && order.status !== "cancelledPaid") continue;
    const index = bucketIndexFor(starts, endMs, order.createdMs);
    if (index < 0) continue;
    const point = points[index]!;
    if (order.status === "cancelledPaid") {
      point.cancelledCount += 1;
      continue;
    }
    point.revenueKurus += order.netKurus;
    point.orderCount += 1;
    if (firstOrderIds.has(order.id)) point.newCustomers += 1;
  }

  return points;
}

interface Ranked {
  quantity: number;
  revenueKurus: number;
}

function rankByLine<K>(
  prepared: PreparedOrder[],
  startMs: number,
  endMs: number,
  keyOf: (line: PreparedOrder["lines"][number]) => K,
): Map<K, Ranked & { title: string; productId: string | null }> {
  const totals = new Map<K, Ranked & { title: string; productId: string | null }>();
  for (const order of prepared) {
    if (order.status !== "paid" || !inWindow(order, startMs, endMs)) continue;
    for (const line of order.lines) {
      const key = keyOf(line);
      const existing = totals.get(key);
      if (existing) {
        existing.quantity += line.quantity;
        existing.revenueKurus += line.grossKurus;
      } else {
        totals.set(key, {
          quantity: line.quantity,
          revenueKurus: line.grossKurus,
          title: line.title,
          productId: line.productId,
        });
      }
    }
  }
  return totals;
}

function coverOf(product: TrProduct | undefined): string | null {
  if (!product) return null;
  return (
    product.images[0] ??
    product.storefrontImages[0] ??
    product.marketplaceImages[0] ??
    null
  );
}

export function computeOwnerDashboard(input: {
  boutiqueId: string;
  orders: TrOrderWithItems[];
  products: TrProduct[];
  window: TrDashboardWindow;
  offersCardPayments: boolean;
  nowMs: number;
}): TrOwnerDashboard {
  const { boutiqueId, orders, products, window, offersCardPayments } = input;
  const prepared = prepareOrders(orders, boutiqueId);

  // Each customer's first paid order (across all time) decides who is "new".
  const firstByEmail = new Map<string, PreparedOrder>();
  for (const order of prepared) {
    if (order.status !== "paid") continue;
    const seen = firstByEmail.get(order.email);
    if (!seen || order.createdMs < seen.createdMs) {
      firstByEmail.set(order.email, order);
    }
  }
  const firstOrderIds = new Set(
    [...firstByEmail.values()].map((order) => order.id),
  );

  const current = computeKpis(
    prepared,
    firstOrderIds,
    window.startMs,
    window.endMs,
    offersCardPayments,
  );
  const previous = computeKpis(
    prepared,
    firstOrderIds,
    window.prevStartMs,
    window.prevEndMs,
    offersCardPayments,
  );

  const productsById = new Map(products.map((product) => [product.id, product]));
  const keyOfProduct = (line: PreparedOrder["lines"][number]) =>
    line.productId ?? `title:${line.title}`;

  const currentByProduct = rankByLine(
    prepared,
    window.startMs,
    window.endMs,
    keyOfProduct,
  );
  const previousByProduct = rankByLine(
    prepared,
    window.prevStartMs,
    window.prevEndMs,
    keyOfProduct,
  );

  const topProducts: TrDashboardTopProduct[] = [...currentByProduct.entries()]
    .sort((a, b) => b[1].revenueKurus - a[1].revenueKurus)
    .slice(0, TOP_LIMIT)
    .map(([key, entry]) => {
      const product = entry.productId
        ? productsById.get(entry.productId)
        : undefined;
      return {
        productId: entry.productId,
        title: product?.title ?? entry.title,
        image: coverOf(product),
        category: product?.category ?? null,
        quantity: entry.quantity,
        revenueKurus: entry.revenueKurus,
        previousRevenueKurus: previousByProduct.get(key)?.revenueKurus ?? 0,
      };
    });

  const categoryOfLine = (line: PreparedOrder["lines"][number]) =>
    (line.productId ? productsById.get(line.productId)?.category : null) ?? null;
  const currentByCategory = rankByLine(
    prepared,
    window.startMs,
    window.endMs,
    categoryOfLine,
  );
  const previousByCategory = rankByLine(
    prepared,
    window.prevStartMs,
    window.prevEndMs,
    categoryOfLine,
  );
  const topCategories: TrDashboardTopCategory[] = [...currentByCategory.entries()]
    .sort((a, b) => b[1].revenueKurus - a[1].revenueKurus)
    .slice(0, TOP_LIMIT)
    .map(([category, entry]) => ({
      category,
      quantity: entry.quantity,
      revenueKurus: entry.revenueKurus,
      previousRevenueKurus: previousByCategory.get(category)?.revenueKurus ?? 0,
    }));

  // Only orders that contain this boutique's products are its to ship or confirm.
  const ownOrders = orders.filter((order) =>
    order.items.some((item) => item.boutiqueId === boutiqueId),
  );
  const pendingFulfillment = ownOrders.filter(
    (order) =>
      isActiveOrder(order) &&
      (order.fulfillmentStatus === "created" ||
        order.fulfillmentStatus === "ready"),
  ).length;
  const awaitingPayment = offersCardPayments
    ? 0
    : ownOrders.filter(
        (order) =>
          order.paymentStatus === "pending" &&
          order.fulfillmentStatus !== "cancelled",
      ).length;
  const lowStock = products.filter(
    (product) =>
      product.status === "available" && product.stock <= LOW_STOCK_AT_MOST,
  ).length;

  return {
    range: {
      id: window.id,
      label: window.label,
      startMs: window.startMs,
      endMs: window.endMs,
      prevStartMs: window.prevStartMs,
      prevEndMs: window.prevEndMs,
      bucket: window.bucket,
    },
    offersCardPayments,
    current,
    previous,
    series: computeSeries(
      prepared,
      firstOrderIds,
      window.startMs,
      window.endMs,
      window.bucket,
    ),
    previousSeries: computeSeries(
      prepared,
      firstOrderIds,
      window.prevStartMs,
      window.prevEndMs,
      window.bucket,
    ),
    topProducts,
    topCategories,
    actions: { pendingFulfillment, awaitingPayment, lowStock },
    generatedAt: new Date(input.nowMs).toISOString(),
  };
}

export type TrDelta =
  | { kind: "none" }
  | { kind: "new" }
  | { kind: "change"; percent: number };

/** Change versus the previous period. Growing from zero is "new", not a fake 100%. */
export function computeDelta(current: number, previous: number): TrDelta {
  if (previous === 0) return current === 0 ? { kind: "none" } : { kind: "new" };
  const percent = ((current - previous) / previous) * 100;
  return { kind: "change", percent: Math.round(percent * 10) / 10 };
}
