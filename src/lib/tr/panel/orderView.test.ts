import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TrOrderWithItems } from "@/types/tr-marketplace";
import { orderReference } from "@/lib/tr/orderReference";
import {
  adjacentOrders,
  customerOrderNumber,
  fulfillmentCardTitle,
  orderPaymentMethod,
  orderShippingKurus,
  orderSubtotalKurus,
  orderUnitCount,
} from "./orderView";

function order(
  id: string,
  at: string,
  over: Partial<TrOrderWithItems> = {},
): TrOrderWithItems {
  return {
    id,
    customerEmail: "a@x.com",
    createdAt: new Date(Date.parse(at)).toISOString(),
    paymentStatus: "paid",
    totalKurus: 0,
    discountKurus: 0,
    iyzicoPaymentId: null,
    items: [],
    ...over,
  } as unknown as TrOrderWithItems;
}

const line = (price: number, quantity: number) =>
  ({ priceKurus: price, quantity }) as TrOrderWithItems["items"][number];

describe("orderReference", () => {
  it("is the first 8 characters of the id in capitals", () => {
    assert.equal(orderReference("a1b2c3d4-0000-4000-8000-000000000000"), "A1B2C3D4");
  });
});

describe("order money", () => {
  const items = [line(20_000, 1), line(15_000, 2)];

  it("sums lines at list price", () => {
    assert.equal(orderSubtotalKurus({ items }), 50_000);
    assert.equal(orderUnitCount({ items }), 3);
  });

  it("derives shipping as what is left after subtotal and discount", () => {
    // 50.000 − 5.000 discount + 12.000 shipping
    assert.equal(
      orderShippingKurus({ items, discountKurus: 5_000, totalKurus: 57_000 }),
      12_000,
    );
    assert.equal(
      orderShippingKurus({ items, discountKurus: 0, totalKurus: 50_000 }),
      0,
    );
  });

  it("never reports negative shipping", () => {
    assert.equal(
      orderShippingKurus({ items, discountKurus: 0, totalKurus: 40_000 }),
      0,
    );
  });

  it("tells card from manual payment by the iyzico payment id", () => {
    assert.equal(orderPaymentMethod({ iyzicoPaymentId: "pay-1" }), "card");
    assert.equal(orderPaymentMethod({ iyzicoPaymentId: null }), "manual");
  });
});

describe("adjacentOrders", () => {
  const list = [
    order("c", "2026-09-24T10:00:00Z"),
    order("b", "2026-09-23T10:00:00Z"),
    order("a", "2026-09-22T10:00:00Z"),
  ];

  it("finds the order above and below in the newest-first list", () => {
    const middle = adjacentOrders(list, "b");
    assert.equal(middle.newer?.id, "c");
    assert.equal(middle.older?.id, "a");
    assert.equal(middle.position, 2);
    assert.equal(middle.total, 3);
  });

  it("has no neighbour past either end", () => {
    assert.equal(adjacentOrders(list, "c").newer, null);
    assert.equal(adjacentOrders(list, "a").older, null);
  });

  it("does not depend on the order the list arrives in", () => {
    const shuffled = [list[2]!, list[0]!, list[1]!];
    assert.equal(adjacentOrders(shuffled, "b").newer?.id, "c");
    assert.equal(adjacentOrders(shuffled, "b").older?.id, "a");
  });

  it("copes with an order that is not in the list", () => {
    assert.deepEqual(adjacentOrders(list, "zzz"), {
      newer: null,
      older: null,
      position: null,
      total: 3,
    });
    assert.equal(adjacentOrders([], "a").total, 0);
  });
});

describe("customerOrderNumber", () => {
  const list = [
    order("3", "2026-09-24T10:00:00Z", { customerEmail: "A@x.com " }),
    order("2", "2026-09-23T10:00:00Z", { paymentStatus: "failed" }),
    order("1", "2026-09-22T10:00:00Z"),
    order("x", "2026-09-21T10:00:00Z", { customerEmail: "other@x.com" }),
  ];

  it("counts this customer's orders up to and including this one", () => {
    assert.equal(customerOrderNumber(list, list[2]!), 1);
    assert.equal(customerOrderNumber(list, list[0]!), 2);
  });

  it("ignores failed checkouts and other customers", () => {
    assert.equal(customerOrderNumber(list, list[3]!), 1);
  });
});

describe("fulfillmentCardTitle", () => {
  it("names the state and the number of pieces", () => {
    assert.equal(fulfillmentCardTitle("created", 1), "Gönderilmeyen (1 ürün)");
    assert.equal(fulfillmentCardTitle("shipped", 3), "Kargoda (3 ürün)");
    assert.equal(fulfillmentCardTitle("cancelled", 2), "İptal edildi (2 ürün)");
  });
});
