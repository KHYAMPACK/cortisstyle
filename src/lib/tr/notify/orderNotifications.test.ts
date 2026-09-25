import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isActionableOwnerOrder,
  isOwnerListedOrder,
} from "@/lib/tr/notify/orderNotifications";

const unpaid = {
  paymentStatus: "pending",
  isSandbox: false,
  fulfillmentStatus: "created",
} as const;

describe("isActionableOwnerOrder", () => {
  it("hides an unpaid card checkout in a card boutique", () => {
    assert.equal(isActionableOwnerOrder(unpaid, { cardCheckout: true }), false);
    assert.equal(
      isActionableOwnerOrder({ ...unpaid, paymentStatus: "failed" }, { cardCheckout: true }),
      false,
    );
  });

  it("shows an unpaid order in a boutique without card checkout", () => {
    assert.equal(isActionableOwnerOrder(unpaid), true);
    assert.equal(isActionableOwnerOrder(unpaid, { cardCheckout: false }), true);
  });

  it("shows an unpaid order the owner created by hand, even in a card boutique", () => {
    assert.equal(
      isActionableOwnerOrder({ ...unpaid, channel: "manual" }, { cardCheckout: true }),
      true,
    );
    assert.equal(
      isOwnerListedOrder({ ...unpaid, channel: "manual" }, { cardCheckout: true }),
      true,
    );
  });

  it("still treats an unpaid shop order as a hold", () => {
    assert.equal(
      isActionableOwnerOrder({ ...unpaid, channel: "storefront" }, { cardCheckout: true }),
      false,
    );
  });

  it("never shows a cancelled order", () => {
    assert.equal(
      isActionableOwnerOrder({ ...unpaid, channel: "manual", fulfillmentStatus: "cancelled" }),
      false,
    );
  });

  it("shows a paid order", () => {
    assert.equal(
      isActionableOwnerOrder({ ...unpaid, paymentStatus: "paid" }, { cardCheckout: true }),
      true,
    );
  });
});
