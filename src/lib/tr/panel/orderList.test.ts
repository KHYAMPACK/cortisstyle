import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TrOrderWithItems } from "@/types/tr-marketplace";
import {
  filterOrders,
  NO_ORDER_FILTERS,
  orderFilterCount,
  orderListDate,
  sortOrders,
  type OrderListFilters,
} from "./orderList";
import { orderPaymentKey } from "./orderView";

const at = (iso: string) => Date.parse(iso);
// Thursday 24 Sep 2026, 15:00 in Istanbul.
const NOW = at("2026-09-24T15:00:00+03:00");

function order(
  id: string,
  when: string,
  over: Record<string, unknown> = {},
): TrOrderWithItems {
  return {
    id,
    customerName: "Ayşe Yılmaz",
    customerEmail: "ayse@example.com",
    customerPhone: "+90 555 111 22 33",
    createdAt: new Date(at(when)).toISOString(),
    fulfillmentStatus: "created",
    paymentStatus: "paid",
    isSandbox: false,
    totalKurus: 100_000,
    items: [{ title: "Keten Elbise" }],
    ...over,
  } as unknown as TrOrderWithItems;
}

const filters = (patch: Partial<OrderListFilters>): OrderListFilters => ({
  ...NO_ORDER_FILTERS,
  ...patch,
});

const LIST = [
  order("aaaa1111-x", "2026-09-24T09:00:00+03:00"),
  order("bbbb2222-x", "2026-09-23T09:00:00+03:00", {
    customerName: "Mehmet Öz",
    customerEmail: "mehmet@example.com",
    customerPhone: null,
    fulfillmentStatus: "shipped",
    items: [{ title: "Saten Bluz" }],
    totalKurus: 250_000,
  }),
  order("cccc3333-x", "2026-09-10T09:00:00+03:00", {
    paymentStatus: "pending",
    fulfillmentStatus: "delivered",
    totalKurus: 50_000,
  }),
  order("dddd4444-x", "2026-08-01T09:00:00+03:00", { isSandbox: true, paymentStatus: "paid" }),
];

const ids = (orders: TrOrderWithItems[]) => orders.map((o) => o.id.slice(0, 4));

describe("orderPaymentKey", () => {
  it("calls test orders sandbox whatever the payment column says", () => {
    assert.equal(orderPaymentKey({ isSandbox: true, paymentStatus: "paid" }), "sandbox");
    assert.equal(orderPaymentKey({ isSandbox: false, paymentStatus: "sandbox" }), "sandbox");
    assert.equal(orderPaymentKey({ isSandbox: false, paymentStatus: "pending" }), "pending");
  });
});

describe("filterOrders", () => {
  it("returns everything with no filters", () => {
    assert.equal(filterOrders(LIST, NO_ORDER_FILTERS, NOW).length, 4);
  });

  it("filters by fulfilment and payment status", () => {
    assert.deepEqual(ids(filterOrders(LIST, filters({ fulfillment: "shipped" }), NOW)), ["bbbb"]);
    assert.deepEqual(ids(filterOrders(LIST, filters({ payment: "pending" }), NOW)), ["cccc"]);
    assert.deepEqual(ids(filterOrders(LIST, filters({ payment: "sandbox" }), NOW)), ["dddd"]);
  });

  it("filters by period using Istanbul days", () => {
    assert.deepEqual(ids(filterOrders(LIST, filters({ period: "today" }), NOW)), ["aaaa"]);
    assert.deepEqual(ids(filterOrders(LIST, filters({ period: "7d" }), NOW)), ["aaaa", "bbbb"]);
    assert.deepEqual(
      ids(filterOrders(LIST, filters({ period: "30d" }), NOW)),
      ["aaaa", "bbbb", "cccc"],
    );
  });

  it("searches order code, customer, phone digits and product, ignoring case and #", () => {
    const find = (search: string) => ids(filterOrders(LIST, filters({ search }), NOW));
    assert.deepEqual(find("#BBBB2222"), ["bbbb"]);
    assert.deepEqual(find("mehmet"), ["bbbb"]);
    assert.deepEqual(find("ÖZ"), ["bbbb"]);
    assert.deepEqual(find("saten"), ["bbbb"]);
    assert.deepEqual(find("5551112233"), ["aaaa", "cccc", "dddd"]);
    assert.deepEqual(find("nothing like this"), []);
  });

  it("needs every word of the search to match", () => {
    assert.deepEqual(ids(filterOrders(LIST, filters({ search: "ayşe elbise" }), NOW)), ["aaaa", "cccc", "dddd"]);
    assert.deepEqual(ids(filterOrders(LIST, filters({ search: "ayşe saten" }), NOW)), []);
  });

  it("combines filters", () => {
    assert.deepEqual(
      ids(filterOrders(LIST, filters({ payment: "paid", period: "7d", search: "elbise" }), NOW)),
      ["aaaa"],
    );
  });
});

describe("orderFilterCount", () => {
  it("counts the popover filters but not the search box", () => {
    assert.equal(orderFilterCount(NO_ORDER_FILTERS), 0);
    assert.equal(orderFilterCount(filters({ search: "x" })), 0);
    assert.equal(orderFilterCount(filters({ fulfillment: "shipped", period: "7d" })), 2);
  });
});

describe("sortOrders", () => {
  it("sorts by date and by total in both directions without touching the input", () => {
    assert.deepEqual(ids(sortOrders(LIST, "date", "desc")), ["aaaa", "bbbb", "cccc", "dddd"]);
    assert.deepEqual(ids(sortOrders(LIST, "date", "asc")), ["dddd", "cccc", "bbbb", "aaaa"]);
    assert.deepEqual(ids(sortOrders(LIST, "total", "desc"))[0], "bbbb");
    assert.deepEqual(ids(sortOrders(LIST, "total", "asc"))[0], "cccc");
    assert.deepEqual(ids(LIST), ["aaaa", "bbbb", "cccc", "dddd"]);
  });

  it("keeps equal values in their original order", () => {
    // aaaa and dddd both total 100.000.
    assert.deepEqual(ids(sortOrders(LIST, "total", "desc")), ["bbbb", "aaaa", "dddd", "cccc"]);
  });
});

describe("orderListDate", () => {
  it("says Bugün and Dün, and gives the time in Istanbul", () => {
    assert.deepEqual(orderListDate("2026-09-24T09:05:00+03:00", NOW), { day: "Bugün", time: "09:05" });
    assert.deepEqual(orderListDate("2026-09-23T23:59:00+03:00", NOW), { day: "Dün", time: "23:59" });
  });

  it("writes older dates out", () => {
    assert.deepEqual(orderListDate("2026-09-10T09:00:00+03:00", NOW), { day: "10 Eyl 2026", time: "09:00" });
  });

  it("uses the Istanbul day, not the UTC one", () => {
    // 22:30 UTC on the 23rd is already 01:30 on the 24th in Istanbul.
    assert.equal(orderListDate("2026-09-23T22:30:00Z", NOW).day, "Bugün");
  });
});
