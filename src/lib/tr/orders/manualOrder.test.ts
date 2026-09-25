import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adjustmentDiscountKurus,
  computeManualTotals,
  EMPTY_MANUAL_ORDER,
  isManualOrderBlank,
  manualOrderReadyError,
  mergeManualLines,
  readManualOrderDraft,
  sameManualOrder,
  type ManualLine,
  type ManualOrderDraft,
} from "@/lib/tr/orders/manualOrder";

const line = (over: Partial<ManualLine> = {}): ManualLine => ({
  productId: "p1",
  size: null,
  variantId: null,
  quantity: 1,
  ...over,
});

function read(raw: unknown) {
  const result = readManualOrderDraft(raw);
  assert.ok(result.ok, result.ok ? "" : result.error);
  return result.draft;
}

describe("mergeManualLines", () => {
  it("adds the quantities of the same product, size and variant", () => {
    const merged = mergeManualLines([
      line({ size: "M", quantity: 1 }),
      line({ size: "L" }),
      line({ size: "M", quantity: 2 }),
    ]);
    assert.deepEqual(
      merged.map((entry) => [entry.size, entry.quantity]),
      [
        ["M", 3],
        ["L", 1],
      ],
    );
  });

  it("keeps a variant apart from the product itself", () => {
    assert.equal(mergeManualLines([line(), line({ variantId: "v1" })]).length, 2);
  });

  it("does not change the lines it was given", () => {
    const input = [line({ quantity: 1 }), line({ quantity: 1 })];
    mergeManualLines(input);
    assert.equal(input[0]!.quantity, 1);
  });

  it("stops at the quantity limit", () => {
    const merged = mergeManualLines([line({ quantity: 990 }), line({ quantity: 50 })]);
    assert.equal(merged[0]!.quantity, 999);
  });
});

describe("adjustmentDiscountKurus", () => {
  it("takes a fixed amount off, never more than the subtotal", () => {
    const amount = { kind: "amount", amountKurus: 5_000, title: "" } as const;
    assert.equal(adjustmentDiscountKurus(20_000, amount), 5_000);
    assert.equal(adjustmentDiscountKurus(3_000, amount), 3_000);
  });

  it("takes a percentage off, rounding down to whole kuruş", () => {
    const percent = { kind: "percent", percent: 10, title: "" } as const;
    assert.equal(adjustmentDiscountKurus(12_345, percent), 1_234);
    assert.equal(
      adjustmentDiscountKurus(10_000, { kind: "percent", percent: 100, title: "" }),
      10_000,
    );
  });

  it("is zero without an adjustment or a subtotal", () => {
    assert.equal(adjustmentDiscountKurus(10_000, null), 0);
    assert.equal(
      adjustmentDiscountKurus(0, { kind: "amount", amountKurus: 100, title: "" }),
      0,
    );
  });
});

describe("computeManualTotals", () => {
  it("adds up lines, subtracts the reduction and adds shipping", () => {
    const totals = computeManualTotals({
      lines: [
        { priceKurus: 10_000, quantity: 2 },
        { priceKurus: 5_050, quantity: 1 },
      ],
      adjustment: { kind: "amount", amountKurus: 1_000, title: "" },
      shippingFeeKurus: 2_500,
    });
    assert.deepEqual(totals, {
      subtotalKurus: 25_050,
      discountKurus: 1_000,
      shippingKurus: 2_500,
      totalKurus: 26_550,
    });
  });

  it("is all zero for an empty order", () => {
    assert.deepEqual(
      computeManualTotals({ lines: [], adjustment: null, shippingFeeKurus: 0 }),
      { subtotalKurus: 0, discountKurus: 0, shippingKurus: 0, totalKurus: 0 },
    );
  });
});

describe("readManualOrderDraft", () => {
  it("reads a complete order", () => {
    const draft = read({
      customerId: " c1 ",
      addressId: "a1",
      lines: [{ productId: "p1", size: "M", variantId: null, quantity: 2 }],
      adjustment: { kind: "percent", percent: 10, title: " Arkadaş " },
      shippingFeeKurus: 5_000,
      customerNote: "  Hediye paketi  ",
      paymentStatus: "paid",
    });
    assert.deepEqual(draft, {
      customerId: "c1",
      addressId: "a1",
      lines: [{ productId: "p1", size: "M", variantId: null, quantity: 2 }],
      adjustment: { kind: "percent", percent: 10, title: "Arkadaş" },
      shippingFeeKurus: 5_000,
      customerNote: "Hediye paketi",
      paymentStatus: "paid",
    });
  });

  it("accepts an unfinished draft", () => {
    assert.deepEqual(read({}), EMPTY_MANUAL_ORDER);
  });

  it("merges duplicate lines", () => {
    const draft = read({
      lines: [
        { productId: "p1", quantity: 1 },
        { productId: "p1", quantity: 2 },
      ],
    });
    assert.equal(draft.lines.length, 1);
    assert.equal(draft.lines[0]!.quantity, 3);
  });

  it("treats anything but 'paid' as pending", () => {
    assert.equal(read({ paymentStatus: "refunded" }).paymentStatus, "pending");
  });

  it("refuses bad quantities", () => {
    for (const quantity of [0, -1, 1.5, 1000, "2", null]) {
      const result = readManualOrderDraft({ lines: [{ productId: "p1", quantity }] });
      assert.equal(result.ok, false, String(quantity));
    }
  });

  it("refuses a line without a product and too many lines", () => {
    assert.equal(readManualOrderDraft({ lines: [{ quantity: 1 }] }).ok, false);
    const many = Array.from({ length: 51 }, (_, i) => ({ productId: `p${i}`, quantity: 1 }));
    assert.equal(readManualOrderDraft({ lines: many }).ok, false);
  });

  it("refuses a bad adjustment", () => {
    for (const adjustment of [
      { kind: "amount", amountKurus: 0, title: "" },
      { kind: "amount", amountKurus: 10.5, title: "" },
      { kind: "amount", amountKurus: -5, title: "" },
      { kind: "percent", percent: 0, title: "" },
      { kind: "percent", percent: 101, title: "" },
      { kind: "raise", amountKurus: 100, title: "" },
      { kind: "amount", amountKurus: 100, title: "x".repeat(81) },
      "10",
    ]) {
      assert.equal(readManualOrderDraft({ adjustment }).ok, false, JSON.stringify(adjustment));
    }
  });

  it("refuses a bad shipping fee and an over-long note", () => {
    for (const shippingFeeKurus of [-1, 1.5, 1_000_001, "5"]) {
      assert.equal(readManualOrderDraft({ shippingFeeKurus }).ok, false);
    }
    assert.equal(readManualOrderDraft({ customerNote: "x".repeat(1001) }).ok, false);
    assert.equal(readManualOrderDraft({ customerNote: 5 }).ok, false);
  });

  it("refuses something that is not an object", () => {
    for (const raw of [null, undefined, "x", 3, []]) {
      assert.equal(readManualOrderDraft(raw).ok, false);
    }
  });
});

describe("manualOrderReadyError", () => {
  const ready: ManualOrderDraft = {
    ...EMPTY_MANUAL_ORDER,
    customerId: "c1",
    addressId: "a1",
    lines: [line()],
  };

  it("is null when there are lines, a customer and an address", () => {
    assert.equal(manualOrderReadyError(ready), null);
  });

  it("names what is missing, lines first", () => {
    assert.match(manualOrderReadyError({ ...ready, lines: [] })!, /ürün/);
    assert.match(manualOrderReadyError({ ...ready, customerId: null })!, /müşteri/);
    assert.match(manualOrderReadyError({ ...ready, addressId: null })!, /adres/);
  });
});

describe("isManualOrderBlank / sameManualOrder", () => {
  it("is blank until something is entered", () => {
    assert.equal(isManualOrderBlank(EMPTY_MANUAL_ORDER), true);
    assert.equal(isManualOrderBlank({ ...EMPTY_MANUAL_ORDER, lines: [line()] }), false);
    assert.equal(isManualOrderBlank({ ...EMPTY_MANUAL_ORDER, customerId: "c1" }), false);
    assert.equal(isManualOrderBlank({ ...EMPTY_MANUAL_ORDER, customerNote: "  " }), true);
  });

  it("compares orders by content, ignoring surrounding whitespace in the note", () => {
    const a = { ...EMPTY_MANUAL_ORDER, customerNote: "merhaba", lines: [line()] };
    assert.equal(sameManualOrder(a, { ...a, customerNote: " merhaba " }), true);
    assert.equal(sameManualOrder(a, { ...a, lines: [line({ quantity: 2 })] }), false);
  });
});
