import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  freeShippingProgress,
  quoteCheckoutShippingFee,
  shippingFeeConfigOf,
  shippingItemCount,
  shippingSubtotalKurus,
  type ShippingFeeConfig,
} from "./quoteShipping";
import {
  freeShippingNudgeDetail,
  freeShippingPromoCopy,
  shippingHomeBody,
  tlLabel,
} from "./shippingCopy";
import { validateShippingSettings } from "./settings";

// lilabutik's live rules, previously hardcoded: 120 TL flat, free at 2+ items.
const LILA: ShippingFeeConfig = {
  feeKurus: 12_000,
  freeMinItems: 2,
  freeMinSubtotalKurus: null,
};

const lines = (n: number, priceKurus = 100_000) =>
  Array.from({ length: n }, () => ({ priceKurus }));

describe("quoteCheckoutShippingFee — lilabutik regression", () => {
  it("charges 120 TL for one item and nothing from two items up", () => {
    assert.equal(quoteCheckoutShippingFee(LILA, lines(1))?.feeKurus, 12_000);
    assert.equal(quoteCheckoutShippingFee(LILA, lines(2))?.feeKurus, 0);
    assert.equal(quoteCheckoutShippingFee(LILA, lines(5))?.feeKurus, 0);
  });

  it("counts quantity on checkout lines, not just the number of rows", () => {
    assert.equal(
      quoteCheckoutShippingFee(LILA, [{ priceKurus: 100_000, quantity: 2 }])
        ?.feeKurus,
      0,
    );
    assert.equal(shippingItemCount([{ quantity: 3 }, {}]), 4);
  });

  it("reads the same rules from a boutique record", () => {
    assert.deepEqual(
      shippingFeeConfigOf({
        shippingFeeKurus: 12_000,
        freeShippingMinItems: 2,
        freeShippingMinSubtotalKurus: null,
      }),
      LILA,
    );
  });

  it("shows the exact copy shoppers see today", () => {
    assert.equal(freeShippingPromoCopy(LILA), "2 ürün ve üzeri kargo ücretsiz");
    assert.equal(
      shippingHomeBody(LILA),
      "2 ürün ve üzeri kargo ücretsiz. Tek üründe 120 TL. Türkiye geneline gönderim.",
    );
    const one = freeShippingProgress(LILA, lines(1));
    assert.ok(one);
    assert.equal(freeShippingNudgeDetail(one), "1 ürün daha ekle, kargo bedava");
  });
});

describe("quoteCheckoutShippingFee — other configurations", () => {
  it("charges nothing and shows nothing when no fee is configured", () => {
    const none = shippingFeeConfigOf({});
    assert.equal(quoteCheckoutShippingFee(none, lines(1)), null);
    assert.equal(freeShippingProgress(none, lines(1)), null);
    assert.equal(shippingHomeBody(none), null);
    assert.equal(freeShippingPromoCopy(none), null);
  });

  it("always charges the fee when there is no free threshold", () => {
    const flat: ShippingFeeConfig = {
      feeKurus: 8_990,
      freeMinItems: null,
      freeMinSubtotalKurus: null,
    };
    assert.equal(quoteCheckoutShippingFee(flat, lines(10))?.feeKurus, 8_990);
    assert.equal(freeShippingProgress(flat, lines(1)), null);
    assert.equal(
      shippingHomeBody(flat),
      "Kargo ücreti 89,90 TL. Türkiye geneline gönderim.",
    );
  });

  it("supports an amount threshold, measured on the items subtotal", () => {
    const byAmount: ShippingFeeConfig = {
      feeKurus: 9_000,
      freeMinItems: null,
      freeMinSubtotalKurus: 50_000,
    };
    assert.equal(
      quoteCheckoutShippingFee(byAmount, [{ priceKurus: 49_999 }])?.feeKurus,
      9_000,
    );
    assert.equal(
      quoteCheckoutShippingFee(byAmount, [{ priceKurus: 50_000 }])?.feeKurus,
      0,
    );
    assert.equal(
      quoteCheckoutShippingFee(byAmount, [{ priceKurus: 30_000, quantity: 2 }])
        ?.feeKurus,
      0,
    );
    assert.equal(shippingSubtotalKurus([{ priceKurus: 1_000, quantity: 3 }, {}]), 3_000);

    const short = freeShippingProgress(byAmount, [{ priceKurus: 30_000 }]);
    assert.ok(short);
    assert.equal(short.unit, "amount");
    assert.equal(short.remaining, 20_000);
    assert.equal(freeShippingNudgeDetail(short), "200 TL daha ekle, kargo bedava");
    assert.equal(freeShippingPromoCopy(byAmount), "500 TL ve üzeri kargo ücretsiz");
  });

  it("formats lira labels", () => {
    assert.equal(tlLabel(12_000), "120 TL");
    assert.equal(tlLabel(8_990), "89,90 TL");
    assert.equal(tlLabel(5), "0,05 TL");
  });
});

describe("validateShippingSettings", () => {
  it("accepts a fee with one threshold and clears the other", () => {
    const result = validateShippingSettings({
      shippingFeeKurus: 12_000,
      freeShippingMinItems: 2,
    });
    assert.ok(result.ok);
    assert.equal(result.value.freeShippingMinSubtotalKurus, null);
  });

  it("rejects both thresholds at once", () => {
    const result = validateShippingSettings({
      freeShippingMinItems: 2,
      freeShippingMinSubtotalKurus: 50_000,
    });
    assert.equal(result.ok, false);
  });

  it("rejects fractions, negatives and out-of-range values", () => {
    assert.equal(validateShippingSettings({ shippingFeeKurus: 12.5 }).ok, false);
    assert.equal(validateShippingSettings({ shippingFeeKurus: -1 }).ok, false);
    assert.equal(validateShippingSettings({ shippingFeeKurus: 100_001 }).ok, false);
    assert.equal(validateShippingSettings({ freeShippingMinItems: 0 }).ok, false);
    assert.equal(
      validateShippingSettings({ freeShippingMinSubtotalKurus: 50 }).ok,
      false,
    );
    assert.equal(validateShippingSettings({ shippingFeeKurus: "120" }).ok, false);
  });

  it("allows clearing a threshold with null and leaves untouched fields out", () => {
    const result = validateShippingSettings({ freeShippingMinItems: null });
    assert.ok(result.ok);
    assert.deepEqual(result.value, { freeShippingMinItems: null });
  });
});
