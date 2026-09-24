/**
 * Bulk actions on selected orders: which of them each action applies to, and how
 * a finished run is described. Pure — the page does the fetching.
 *
 * Bulk is deliberately stricter than the order page. There you decide about one
 * order you are looking at; here one click touches many you may not have read,
 * so status moves only go forward, and only for orders that are paid.
 */

import { hasPurchasedShippingLabel } from "@/lib/tr/shipping/types";
import { orderPaymentKey } from "@/lib/tr/panel/orderView";
import type {
  TrFulfillmentStatus,
  TrOrderWithItems,
} from "@/types/tr-marketplace";

export type OrderBulkAction =
  | "ready"
  | "shipped"
  | "delivered"
  | "paid"
  | "print-labels";

export const BULK_STATUS_OF: Partial<
  Record<OrderBulkAction, TrFulfillmentStatus>
> = {
  ready: "ready",
  shipped: "shipped",
  delivered: "delivered",
};

/** The statuses an order can move to each target from — forward only. */
const MOVES_FROM: Record<
  "ready" | "shipped" | "delivered",
  TrFulfillmentStatus[]
> = {
  ready: ["created"],
  shipped: ["created", "ready"],
  delivered: ["created", "ready", "shipped"],
};

export interface OrderBulkContext {
  /** The boutique has a live carrier integration (labels can exist). */
  hasCarrierIntegration: boolean;
  /** The boutique takes card payments, so pending orders are not the owner's to mark paid. */
  offersCardPayments: boolean;
}

function isSettled(order: TrOrderWithItems): boolean {
  const payment = orderPaymentKey(order);
  return payment === "paid" || payment === "sandbox";
}

/** The selected orders this action can be applied to. */
export function eligibleOrders(
  action: OrderBulkAction,
  orders: readonly TrOrderWithItems[],
  context: OrderBulkContext,
): TrOrderWithItems[] {
  switch (action) {
    case "ready":
    case "shipped":
    case "delivered":
      return orders.filter(
        (order) =>
          isSettled(order) &&
          MOVES_FROM[action].includes(order.fulfillmentStatus),
      );
    case "paid":
      return context.offersCardPayments
        ? []
        : orders.filter(
            (order) =>
              order.paymentStatus === "pending" &&
              !order.isSandbox &&
              order.fulfillmentStatus !== "cancelled",
          );
    case "print-labels":
      return context.hasCarrierIntegration
        ? orders.filter(
            (order) =>
              order.fulfillmentStatus !== "cancelled" &&
              hasPurchasedShippingLabel(order.shipment),
          )
        : [];
  }
}

export interface OrderBulkResultSummary {
  /** The whole thing worked (or there was nothing to report as wrong). */
  tone: "success" | "warning" | "error";
  lines: string[];
}

const DONE_TEXT: Record<Exclude<OrderBulkAction, "print-labels">, string> = {
  ready: "Kargoya hazır yapıldı",
  shipped: "Kargoda yapıldı",
  delivered: "Teslim edildi yapıldı",
  paid: "Ödendi olarak işaretlendi",
};

/**
 * What to tell the owner after a run: how many worked, how many did not (and the
 * first reason), and how many of the selection the action did not apply to.
 */
export function summarizeBulkRun(input: {
  action: OrderBulkAction;
  done: number;
  failed: Array<{ error: string }>;
  skipped: number;
}): OrderBulkResultSummary {
  const { action, done, failed, skipped } = input;
  const lines: string[] = [];

  if (done > 0) {
    lines.push(
      action === "print-labels"
        ? `${done} etiket yazdırma sayfasına eklendi.`
        : `${done} sipariş ${DONE_TEXT[action]}.`,
    );
  }
  if (failed.length > 0) {
    lines.push(
      `${failed.length} sipariş ${action === "print-labels" ? "için etiket alınamadı" : "güncellenemedi"}: ${failed[0]!.error}`,
    );
  }
  if (skipped > 0) {
    lines.push(`${skipped} sipariş bu işleme uygun olmadığı için atlandı.`);
  }
  if (lines.length === 0) lines.push("Seçili siparişlere uygulanabilecek bir işlem yok.");

  const tone =
    failed.length === 0 ? (done > 0 ? "success" : "warning") : done > 0 ? "warning" : "error";
  return { tone, lines };
}
