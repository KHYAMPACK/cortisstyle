import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TrOrderWithItems, TrProduct } from "@/types/tr-marketplace";
import { computeDelta, computeOwnerDashboard } from "./dashboardMetrics";
import { resolveDashboardWindow } from "./dashboardRange";

const BOUTIQUE = "boutique-1";
const OTHER = "boutique-2";
const at = (iso: string) => Date.parse(iso);
const NOW = at("2026-09-24T12:00:00+03:00");

interface OrderSpec {
  id: string;
  at: string;
  email: string;
  payment: TrOrderWithItems["paymentStatus"];
  fulfillment?: TrOrderWithItems["fulfillmentStatus"];
  cardPayment?: boolean;
  sandbox?: boolean;
  discountKurus?: number;
  boutiqueId?: string;
  lines: Array<{ productId: string | null; title: string; price: number; qty: number }>;
}

function order(spec: OrderSpec): TrOrderWithItems {
  return {
    id: spec.id,
    customerEmail: spec.email,
    customerName: spec.email,
    discountKurus: spec.discountKurus ?? 0,
    paymentStatus: spec.payment,
    fulfillmentStatus: spec.fulfillment ?? "created",
    isSandbox: spec.sandbox ?? false,
    iyzicoPaymentId: spec.cardPayment ? `pay-${spec.id}` : null,
    createdAt: new Date(at(spec.at)).toISOString(),
    items: spec.lines.map((line, index) => ({
      id: `${spec.id}-${index}`,
      orderId: spec.id,
      productId: line.productId,
      boutiqueId: spec.boutiqueId ?? BOUTIQUE,
      title: line.title,
      priceKurus: line.price,
      quantity: line.qty,
    })),
  } as unknown as TrOrderWithItems;
}

function product(id: string, over: Partial<TrProduct> = {}): TrProduct {
  return {
    id,
    title: `Ürün ${id}`,
    category: "elbise",
    status: "available",
    stock: 10,
    images: [`/img/${id}.jpg`],
    storefrontImages: [],
    marketplaceImages: [],
    ...over,
  } as unknown as TrProduct;
}

const PRODUCTS = [
  product("p1", { category: "elbise" }),
  product("p2", { category: "ust-giyim", stock: 1 }),
  product("p3", { category: "elbise", status: "hidden", stock: 0 }),
];

// A mix like lilabutik's real data: card-paid, manual-paid, paid then cancelled,
// failed and pending card checkouts, a test order, and another boutique's order.
const ORDERS: TrOrderWithItems[] = [
  // Current 7-day window (18 – 24 Sep).
  order({ id: "o1", at: "2026-09-23T10:00:00+03:00", email: "A@x.com", payment: "paid", cardPayment: true, lines: [{ productId: "p1", title: "Elbise", price: 100_000, qty: 1 }] }),
  order({ id: "o2", at: "2026-09-22T15:00:00+03:00", email: "b@x.com", payment: "paid", discountKurus: 10_000, lines: [{ productId: "p2", title: "Üst", price: 50_000, qty: 2 }] }),
  order({ id: "o3", at: "2026-09-24T09:00:00+03:00", email: "a@x.com ", payment: "paid", cardPayment: true, lines: [{ productId: "p1", title: "Elbise", price: 80_000, qty: 1 }] }),
  order({ id: "o4", at: "2026-09-22T11:00:00+03:00", email: "c@x.com", payment: "paid", fulfillment: "cancelled", lines: [{ productId: "p2", title: "Üst", price: 70_000, qty: 1 }] }),
  order({ id: "o5", at: "2026-09-23T12:00:00+03:00", email: "e@x.com", payment: "failed", lines: [{ productId: "p1", title: "Elbise", price: 100_000, qty: 1 }] }),
  order({ id: "o6", at: "2026-09-24T10:00:00+03:00", email: "f@x.com", payment: "pending", lines: [{ productId: "p1", title: "Elbise", price: 100_000, qty: 1 }] }),
  order({ id: "o7", at: "2026-09-21T10:00:00+03:00", email: "t@x.com", payment: "sandbox", sandbox: true, lines: [{ productId: "p1", title: "Elbise", price: 999_000, qty: 1 }] }),
  order({ id: "o9", at: "2026-09-21T10:00:00+03:00", email: "z@x.com", payment: "paid", boutiqueId: OTHER, lines: [{ productId: null, title: "Başkası", price: 500_000, qty: 1 }] }),
  // Previous window (equal length before 18 Sep).
  order({ id: "o8", at: "2026-09-15T10:00:00+03:00", email: "d@x.com", payment: "paid", lines: [{ productId: "p1", title: "Elbise", price: 60_000, qty: 1 }] }),
];

function dashboard(offersCardPayments: boolean) {
  const resolved = resolveDashboardWindow({ range: "7d", nowMs: NOW });
  assert.ok(resolved.ok);
  return computeOwnerDashboard({
    boutiqueId: BOUTIQUE,
    orders: ORDERS,
    products: PRODUCTS,
    window: resolved.window,
    offersCardPayments,
    nowMs: NOW,
  });
}

describe("computeOwnerDashboard", () => {
  const result = dashboard(true);
  const { current, previous } = result;

  it("counts only paid, non-cancelled, non-test orders of this boutique", () => {
    assert.equal(current.orderCount, 3);
    assert.equal(current.itemCount, 4);
    // 100.000 + (100.000 − 10.000 discount) + 80.000 — no shipping, no other boutique.
    assert.equal(current.revenueKurus, 270_000);
    assert.equal(current.averageOrderKurus, 90_000);
    assert.equal(current.itemsPerOrder, 4 / 3);
    // Gross list prices: 100.000 + 100.000 + 80.000 over 4 items.
    assert.equal(current.averageItemPriceKurus, 70_000);
  });

  it("identifies new and returning customers by lower-cased, trimmed email", () => {
    assert.equal(current.customerCount, 2);
    assert.equal(current.newCustomers, 2);
    assert.equal(current.repeatRate, 0);
  });

  it("treats a customer who ordered before the window as returning", () => {
    const withHistory = computeOwnerDashboard({
      boutiqueId: BOUTIQUE,
      orders: [
        ...ORDERS,
        order({ id: "old", at: "2026-06-01T10:00:00+03:00", email: "b@x.com", payment: "paid", lines: [{ productId: "p1", title: "Elbise", price: 10_000, qty: 1 }] }),
      ],
      products: PRODUCTS,
      window: (() => {
        const r = resolveDashboardWindow({ range: "7d", nowMs: NOW });
        assert.ok(r.ok);
        return r.window;
      })(),
      offersCardPayments: true,
      nowMs: NOW,
    });
    assert.equal(withHistory.current.newCustomers, 1);
    assert.equal(withHistory.current.repeatRate, 0.5);
  });

  it("reports orders that were paid and then cancelled", () => {
    assert.equal(current.cancelledCount, 1);
    assert.equal(current.cancelledKurus, 70_000);
  });

  it("splits card and manual payments and totals discounts", () => {
    assert.equal(current.cardOrderCount, 2);
    assert.equal(current.cardRevenueKurus, 180_000);
    assert.equal(current.manualOrderCount, 1);
    assert.equal(current.manualRevenueKurus, 90_000);
    assert.equal(current.discountedOrderCount, 1);
    assert.equal(current.discountKurus, 10_000);
  });

  it("computes payment completion from card checkouts (paid + failed + pending)", () => {
    assert.equal(current.paymentAttempts, 4);
    assert.equal(current.paymentCompletionRate, 0.5);
  });

  it("has no payment completion for a boutique without card payments", () => {
    const manual = dashboard(false);
    assert.equal(manual.current.paymentAttempts, 0);
    assert.equal(manual.current.paymentCompletionRate, null);
  });

  it("computes the previous period from the window before", () => {
    assert.equal(previous.orderCount, 1);
    assert.equal(previous.revenueKurus, 60_000);
    assert.equal(previous.newCustomers, 1);
  });

  it("builds a daily series that adds up to the totals", () => {
    assert.equal(result.series.length, 7);
    assert.equal(result.series.reduce((s, p) => s + p.revenueKurus, 0), current.revenueKurus);
    assert.equal(result.series.reduce((s, p) => s + p.orderCount, 0), current.orderCount);
    assert.equal(result.series.reduce((s, p) => s + p.cancelledCount, 0), 1);
    assert.equal(result.series[6]!.revenueKurus, 80_000);
    assert.equal(result.series[6]!.orderCount, 1);
    assert.equal(result.previousSeries.length, result.series.length);
  });

  it("ranks top products by gross line revenue with photo, category and previous period", () => {
    const [first, second] = result.topProducts;
    assert.equal(first!.productId, "p1");
    assert.equal(first!.revenueKurus, 180_000);
    assert.equal(first!.quantity, 2);
    assert.equal(first!.image, "/img/p1.jpg");
    assert.equal(first!.category, "elbise");
    assert.equal(first!.previousRevenueKurus, 60_000);
    assert.equal(second!.productId, "p2");
    assert.equal(second!.revenueKurus, 100_000);
  });

  it("ranks categories", () => {
    assert.deepEqual(
      result.topCategories.map((entry) => [entry.category, entry.revenueKurus]),
      [
        ["elbise", 180_000],
        ["ust-giyim", 100_000],
      ],
    );
  });

  it("counts things the owner needs to act on", () => {
    // Paid or test orders still to ship: o1, o2, o3, o7 (test) and the older o8.
    assert.equal(result.actions.pendingFulfillment, 5);
    // A card boutique's pending orders are in-flight checkouts, not awaiting approval.
    assert.equal(result.actions.awaitingPayment, 0);
    // p2 has 1 in stock; the hidden p3 doesn't count.
    assert.equal(result.actions.lowStock, 1);
    // A manual boutique's pending order does wait on the owner.
    assert.equal(dashboard(false).actions.awaitingPayment, 1);
  });

  it("is all zeros, not an error, when there are no orders", () => {
    const resolved = resolveDashboardWindow({ range: "today", nowMs: NOW });
    assert.ok(resolved.ok);
    const empty = computeOwnerDashboard({
      boutiqueId: BOUTIQUE,
      orders: [],
      products: [],
      window: resolved.window,
      offersCardPayments: false,
      nowMs: NOW,
    });
    assert.equal(empty.current.revenueKurus, 0);
    assert.equal(empty.current.averageOrderKurus, 0);
    assert.equal(empty.current.repeatRate, null);
    assert.equal(empty.topProducts.length, 0);
    assert.equal(empty.series.length, 13);
  });
});

describe("computeDelta", () => {
  it("reports percent change", () => {
    assert.deepEqual(computeDelta(150, 100), { kind: "change", percent: 50 });
    assert.deepEqual(computeDelta(50, 100), { kind: "change", percent: -50 });
    assert.deepEqual(computeDelta(100, 100), { kind: "change", percent: 0 });
    assert.deepEqual(computeDelta(1, 3), { kind: "change", percent: -66.7 });
  });

  it("never invents a percentage when there was nothing before", () => {
    assert.deepEqual(computeDelta(0, 0), { kind: "none" });
    assert.deepEqual(computeDelta(200, 0), { kind: "new" });
  });
});
