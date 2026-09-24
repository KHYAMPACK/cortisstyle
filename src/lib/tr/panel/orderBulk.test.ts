import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TrOrderWithItems } from "@/types/tr-marketplace";
import {
  eligibleOrders,
  summarizeBulkRun,
  type OrderBulkContext,
} from "./orderBulk";

function order(id: string, over: Record<string, unknown> = {}): TrOrderWithItems {
  return {
    id,
    fulfillmentStatus: "created",
    paymentStatus: "paid",
    isSandbox: false,
    shipment: { barcode: null, status: null },
    ...over,
  } as unknown as TrOrderWithItems;
}

const MANUAL: OrderBulkContext = { hasCarrierIntegration: false, offersCardPayments: false };
const CARRIER: OrderBulkContext = { hasCarrierIntegration: true, offersCardPayments: true };

const ids = (orders: TrOrderWithItems[]) => orders.map((o) => o.id);

describe("eligibleOrders — status moves", () => {
  const list = [
    order("new"),
    order("ready", { fulfillmentStatus: "ready" }),
    order("shipped", { fulfillmentStatus: "shipped" }),
    order("delivered", { fulfillmentStatus: "delivered" }),
    order("cancelled", { fulfillmentStatus: "cancelled" }),
  ];

  it("only moves orders forward", () => {
    assert.deepEqual(ids(eligibleOrders("ready", list, MANUAL)), ["new"]);
    assert.deepEqual(ids(eligibleOrders("shipped", list, MANUAL)), ["new", "ready"]);
    assert.deepEqual(
      ids(eligibleOrders("delivered", list, MANUAL)),
      ["new", "ready", "shipped"],
    );
  });

  it("never touches cancelled orders", () => {
    for (const action of ["ready", "shipped", "delivered"] as const) {
      assert.ok(!ids(eligibleOrders(action, list, MANUAL)).includes("cancelled"));
    }
  });

  it("leaves unpaid, failed and refunded orders alone, but takes test orders", () => {
    const unpaid = [
      order("pending", { paymentStatus: "pending" }),
      order("failed", { paymentStatus: "failed" }),
      order("refunded", { paymentStatus: "refunded" }),
      order("sandbox", { paymentStatus: "sandbox" }),
      order("test", { isSandbox: true }),
    ];
    assert.deepEqual(ids(eligibleOrders("shipped", unpaid, MANUAL)), ["sandbox", "test"]);
  });
});

describe("eligibleOrders — mark paid", () => {
  const list = [
    order("pending", { paymentStatus: "pending" }),
    order("paid"),
    order("pendingCancelled", { paymentStatus: "pending", fulfillmentStatus: "cancelled" }),
    order("pendingTest", { paymentStatus: "pending", isSandbox: true }),
  ];

  it("applies to pending, live orders of a boutique that confirms payments by hand", () => {
    assert.deepEqual(ids(eligibleOrders("paid", list, MANUAL)), ["pending"]);
  });

  it("never applies to a boutique that takes card payments", () => {
    assert.deepEqual(eligibleOrders("paid", list, { ...MANUAL, offersCardPayments: true }), []);
  });
});

describe("eligibleOrders — print labels", () => {
  const list = [
    order("labelled", { shipment: { barcode: "ABC123", status: "READY_TO_SHIP" } }),
    order("draft", { shipment: { barcode: "ABC123", status: "NEW" } }),
    order("none"),
    order("cancelled", {
      fulfillmentStatus: "cancelled",
      shipment: { barcode: "ZZZ", status: "READY_TO_SHIP" },
    }),
  ];

  it("applies to orders that have a bought label, and not to drafts or cancelled orders", () => {
    assert.deepEqual(ids(eligibleOrders("print-labels", list, CARRIER)), ["labelled"]);
  });

  it("does nothing for a boutique without a carrier integration", () => {
    assert.deepEqual(eligibleOrders("print-labels", list, MANUAL), []);
  });
});

describe("summarizeBulkRun", () => {
  it("reports a clean run as a success", () => {
    const summary = summarizeBulkRun({ action: "shipped", done: 3, failed: [], skipped: 0 });
    assert.equal(summary.tone, "success");
    assert.deepEqual(summary.lines, ["3 sipariş Kargoda yapıldı."]);
  });

  it("names the first reason when some failed, and counts what was skipped", () => {
    const summary = summarizeBulkRun({
      action: "ready",
      done: 2,
      failed: [{ error: "Sipariş bulunamadı." }, { error: "Başka bir hata" }],
      skipped: 1,
    });
    assert.equal(summary.tone, "warning");
    assert.deepEqual(summary.lines, [
      "2 sipariş Kargoya hazır yapıldı.",
      "2 sipariş güncellenemedi: Sipariş bulunamadı.",
      "1 sipariş bu işleme uygun olmadığı için atlandı.",
    ]);
  });

  it("is an error when nothing worked", () => {
    const summary = summarizeBulkRun({
      action: "paid",
      done: 0,
      failed: [{ error: "Kart ödemesi iyzico ile alınır." }],
      skipped: 0,
    });
    assert.equal(summary.tone, "error");
  });

  it("words label printing differently", () => {
    const summary = summarizeBulkRun({
      action: "print-labels",
      done: 4,
      failed: [{ error: "Etiket iptal edilmiş." }],
      skipped: 0,
    });
    assert.deepEqual(summary.lines, [
      "4 etiket yazdırma sayfasına eklendi.",
      "1 sipariş için etiket alınamadı: Etiket iptal edilmiş.",
    ]);
  });

  it("says so when there was nothing to do", () => {
    const summary = summarizeBulkRun({ action: "ready", done: 0, failed: [], skipped: 0 });
    assert.equal(summary.tone, "warning");
    assert.equal(summary.lines.length, 1);
  });
});
