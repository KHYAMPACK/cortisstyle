/**
 * The Müşteriler list: search, filters, sorting and the neighbours for the
 * detail page's Önceki / Sonraki. Pure, like the order list's.
 */

import type { CustomerStats } from "@/lib/tr/customers/customerModel";
import { resolveDashboardWindow } from "@/lib/tr/panel/dashboardRange";
import type { OrderPeriod } from "@/lib/tr/panel/orderList";
import { foldForSearch } from "@/lib/tr/panel/searchFold";
import type { TrBoutiqueCustomer } from "@/types/tr-marketplace";

export interface CustomerRow {
  customer: TrBoutiqueCustomer;
  stats: CustomerStats;
}

export type CustomerOrdersFilter = "all" | "with" | "without";

export interface CustomerListFilters {
  search: string;
  /** Customers who have ordered, or who never have. */
  orders: CustomerOrdersFilter;
  /** When the customer was added. */
  period: OrderPeriod;
}

export const NO_CUSTOMER_FILTERS: CustomerListFilters = {
  search: "",
  orders: "all",
  period: "all",
};

export const CUSTOMER_ORDERS_OPTIONS: ReadonlyArray<{
  id: CustomerOrdersFilter;
  label: string;
}> = [
  { id: "all", label: "Tümü" },
  { id: "with", label: "Sipariş verenler" },
  { id: "without", label: "Sipariş Yok" },
];

/** How many of the Filtre popover's filters are on (search has its own box). */
export function customerFilterCount(filters: CustomerListFilters): number {
  return [filters.orders, filters.period].filter((value) => value !== "all").length;
}

function searchText({ customer }: CustomerRow): string {
  return [
    customer.name,
    customer.email,
    customer.phone ?? "",
    (customer.phone ?? "").replace(/\D/g, ""),
    customer.note ?? "",
  ]
    .map(foldForSearch)
    .join(" ");
}

export function filterCustomers(
  rows: readonly CustomerRow[],
  filters: CustomerListFilters,
  nowMs: number,
): CustomerRow[] {
  let window: { startMs: number; endMs: number } | null = null;
  if (filters.period !== "all") {
    const resolved = resolveDashboardWindow({ range: filters.period, nowMs });
    if (resolved.ok) window = resolved.window;
  }
  const words = foldForSearch(filters.search).split(/\s+/).filter(Boolean);

  return rows.filter((row) => {
    if (filters.orders === "with" && row.stats.orderCount === 0) return false;
    if (filters.orders === "without" && row.stats.orderCount > 0) return false;
    if (window) {
      const added = Date.parse(row.customer.createdAt);
      if (added < window.startMs || added >= window.endMs) return false;
    }
    if (words.length === 0) return true;
    const text = searchText(row);
    return words.every((word) => text.includes(word));
  });
}

export type CustomerSortKey = "name" | "createdAt" | "spend";
export type CustomerSortDirection = "asc" | "desc";

/** A sorted copy; equal values keep the order they came in. */
export function sortCustomers(
  rows: readonly CustomerRow[],
  key: CustomerSortKey,
  direction: CustomerSortDirection,
): CustomerRow[] {
  const sign = direction === "asc" ? 1 : -1;
  const compare = (a: CustomerRow, b: CustomerRow): number => {
    if (key === "name") {
      return a.customer.name.localeCompare(b.customer.name, "tr-TR");
    }
    if (key === "spend") return a.stats.spendKurus - b.stats.spendKurus;
    return Date.parse(a.customer.createdAt) - Date.parse(b.customer.createdAt);
  };
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => sign * compare(a.row, b.row) || a.index - b.index)
    .map(({ row }) => row);
}

export interface AdjacentCustomers {
  /** The customer just above this one in the newest-first list. */
  previousId: string | null;
  /** The one just below. */
  nextId: string | null;
  position: number | null;
  total: number;
}

/** Neighbours in the list's default order (newest first) — what Önceki / Sonraki open. */
export function adjacentCustomers(
  rows: readonly CustomerRow[],
  customerId: string,
): AdjacentCustomers {
  const sorted = sortCustomers(rows, "createdAt", "desc");
  const index = sorted.findIndex((row) => row.customer.id === customerId);
  if (index < 0) {
    return { previousId: null, nextId: null, position: null, total: sorted.length };
  }
  return {
    previousId: sorted[index - 1]?.customer.id ?? null,
    nextId: sorted[index + 1]?.customer.id ?? null,
    position: index + 1,
    total: sorted.length,
  };
}
