/**
 * Pure logic behind the order list: filtering, searching, sorting and the
 * "Bugün 15:59" date cell. No I/O, so it is tested and the table stays dumb.
 */

import type {
  TrFulfillmentStatus,
  TrOrderWithItems,
  TrPaymentStatus,
} from "@/types/tr-marketplace";
import {
  istanbulDayString,
  resolveDashboardWindow,
} from "@/lib/tr/panel/dashboardRange";
import { orderPaymentKey } from "@/lib/tr/panel/orderView";
import { orderReference } from "@/lib/tr/orderReference";

export type OrderPeriod = "all" | "today" | "7d" | "30d";

export const ORDER_PERIOD_OPTIONS: ReadonlyArray<{
  id: OrderPeriod;
  label: string;
}> = [
  { id: "all", label: "Tümü" },
  { id: "today", label: "Bugün" },
  { id: "7d", label: "Son 7 gün" },
  { id: "30d", label: "Son 30 gün" },
];

export interface OrderListFilters {
  search: string;
  fulfillment: "all" | TrFulfillmentStatus;
  payment: "all" | TrPaymentStatus;
  period: OrderPeriod;
}

export const NO_ORDER_FILTERS: OrderListFilters = {
  search: "",
  fulfillment: "all",
  payment: "all",
  period: "all",
};

/** How many of the Filtre popover's filters are on (search has its own box). */
export function orderFilterCount(filters: OrderListFilters): number {
  return [filters.fulfillment, filters.payment, filters.period].filter(
    (value) => value !== "all",
  ).length;
}

function lower(value: string): string {
  return value.toLocaleLowerCase("tr-TR");
}

function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}

function searchText(order: TrOrderWithItems): string {
  return [
    orderReference(order.id),
    order.customerName,
    order.customerEmail,
    order.customerPhone ?? "",
    digitsOf(order.customerPhone ?? ""),
    ...order.items.map((item) => item.title),
  ]
    .map(lower)
    .join(" ");
}

/** Every word typed must appear somewhere (order code, customer, phone, product). */
function matchesSearch(order: TrOrderWithItems, query: string): boolean {
  const words = lower(query)
    .replace(/#/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return true;
  const text = searchText(order);
  return words.every((word) => text.includes(word));
}

export function filterOrders(
  orders: readonly TrOrderWithItems[],
  filters: OrderListFilters,
  nowMs: number,
): TrOrderWithItems[] {
  let window: { startMs: number; endMs: number } | null = null;
  if (filters.period !== "all") {
    const resolved = resolveDashboardWindow({ range: filters.period, nowMs });
    if (resolved.ok) window = resolved.window;
  }

  return orders.filter((order) => {
    if (
      filters.fulfillment !== "all" &&
      order.fulfillmentStatus !== filters.fulfillment
    ) {
      return false;
    }
    if (filters.payment !== "all" && orderPaymentKey(order) !== filters.payment) {
      return false;
    }
    if (window) {
      const placed = Date.parse(order.createdAt);
      if (placed < window.startMs || placed >= window.endMs) return false;
    }
    return matchesSearch(order, filters.search);
  });
}

export type OrderSortKey = "date" | "total";
export type SortDirection = "asc" | "desc";

/** A sorted copy; equal values keep the order they came in. */
export function sortOrders(
  orders: readonly TrOrderWithItems[],
  key: OrderSortKey,
  direction: SortDirection,
): TrOrderWithItems[] {
  const sign = direction === "asc" ? 1 : -1;
  const valueOf = (order: TrOrderWithItems) =>
    key === "date" ? Date.parse(order.createdAt) : order.totalKurus;
  return orders
    .map((order, index) => ({ order, index }))
    .sort(
      (a, b) =>
        sign * (valueOf(a.order) - valueOf(b.order)) || a.index - b.index,
    )
    .map(({ order }) => order);
}

const dayFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** The two lines of the date cell: "Bugün" / "Dün" / "24 Eyl 2026", and the time. */
export function orderListDate(
  iso: string,
  nowMs: number,
): { day: string; time: string } {
  const placed = new Date(iso);
  const placedDay = istanbulDayString(placed.getTime());
  let day: string;
  if (placedDay === istanbulDayString(nowMs)) day = "Bugün";
  else if (placedDay === istanbulDayString(nowMs - 86_400_000)) day = "Dün";
  else day = dayFormat.format(placed);
  return { day, time: timeFormat.format(placed) };
}
