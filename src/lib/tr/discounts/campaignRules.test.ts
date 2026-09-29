import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  campaignDiscountKurus,
  campaignMatchesCart,
  cartItemCount,
  cartSubtotalKurus,
  evaluateCodeRedemption,
  qualifyingSubtotalKurus,
  readCampaignBody,
  resolveAutomaticDiscount,
  type DiscountCartContext,
} from "@/lib/tr/discounts/campaignRules";
import type {
  TrDiscountCampaign,
  TrDiscountCampaignCode,
} from "@/lib/tr/discounts/types";

const NOW = new Date("2026-06-15T12:00:00.000Z");

function campaign(overrides: Partial<TrDiscountCampaign> = {}): TrDiscountCampaign {
  return {
    id: "c1",
    boutiqueId: "b1",
    kind: "automatic",
    title: "Test",
    discountType: "percent",
    percentOff: 10,
    amountOffKurus: null,
    scopeAll: true,
    productIds: [],
    includeSaleItems: false,
    minSubtotalKurus: null,
    maxSubtotalKurus: null,
    minItems: null,
    maxItems: null,
    stackable: false,
    usageLimitTotal: null,
    usageLimitPerCustomer: null,
    usedCount: 0,
    startsAt: null,
    endsAt: null,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function line(overrides: Partial<DiscountCartContext["lines"][number]>) {
  return { productId: "p1", priceKurus: 1000, quantity: 1, onSale: false, ...overrides };
}

function cart(...lines: DiscountCartContext["lines"][number][]): DiscountCartContext {
  return { lines };
}

describe("readCampaignBody", () => {
  const base = (overrides: Record<string, unknown> = {}) => ({
    kind: "automatic",
    title: "Yaz indirimi",
    discountType: "percent",
    percentOff: 10,
    ...overrides,
  });

  it("reads a minimal percent campaign", () => {
    const input = readCampaignBody(base());
    assert.equal(input.kind, "automatic");
    assert.equal(input.title, "Yaz indirimi");
    assert.equal(input.percentOff, 10);
    assert.equal(input.amountOffKurus, null);
    assert.equal(input.scopeAll, true);
    assert.equal(input.active, true);
  });

  it("requires a title, trims it, and enforces the length", () => {
    assert.throws(() => readCampaignBody(base({ title: "  " })), /başlığı zorunlu/);
    assert.equal(readCampaignBody(base({ title: "  Yaz   indirimi  " })).title, "Yaz indirimi");
    assert.throws(() => readCampaignBody(base({ title: "x".repeat(81) })), /en fazla 80/);
  });

  it("requires a rate matching the discount type, and only that rate", () => {
    assert.throws(() => readCampaignBody(base({ percentOff: undefined })), /oranı zorunlu/);
    assert.throws(() => readCampaignBody(base({ percentOff: 0 })), /oranı geçersiz/);
    assert.throws(() => readCampaignBody(base({ percentOff: 101 })), /oranı geçersiz/);
    const fixed = readCampaignBody(base({ discountType: "fixed", amountOffKurus: 5000, percentOff: undefined }));
    assert.equal(fixed.amountOffKurus, 5000);
    assert.equal(fixed.percentOff, null);
    assert.throws(() => readCampaignBody(base({ discountType: "fixed" })), /tutarı zorunlu/);
    const free = readCampaignBody(base({ discountType: "free_shipping", percentOff: undefined }));
    assert.equal(free.percentOff, null);
    assert.equal(free.amountOffKurus, null);
  });

  it("needs at least one product when scoped, and none when not", () => {
    assert.throws(
      () => readCampaignBody(base({ scopeAll: false, productIds: [] })),
      /en az bir ürün/,
    );
    const scoped = readCampaignBody(base({ scopeAll: false, productIds: ["p1", "p2"] }));
    assert.deepEqual(scoped.productIds, ["p1", "p2"]);
  });

  it("validates the requirement ranges", () => {
    assert.throws(
      () => readCampaignBody(base({ minSubtotalKurus: 5000, maxSubtotalKurus: 1000 })),
      /tutarı için minimum/,
    );
    assert.throws(
      () => readCampaignBody(base({ minItems: 5, maxItems: 1 })),
      /adedi için minimum/,
    );
    assert.throws(() => readCampaignBody(base({ minItems: 0 })), /adedi geçersiz/);
  });

  it("keeps usage limits on automatic campaigns but rejects them on code campaigns", () => {
    const automatic = readCampaignBody(base({ usageLimitTotal: 100, usageLimitPerCustomer: 1 }));
    assert.equal(automatic.usageLimitTotal, 100);
    assert.throws(
      () => readCampaignBody(base({ kind: "code", usageLimitTotal: 100 })),
      /kuponlarda ayarlanır/,
    );
  });

  it("validates the date window", () => {
    assert.throws(() => readCampaignBody(base({ startsAt: "not a date" })), /Başlangıç tarihi geçersiz/);
    assert.throws(
      () => readCampaignBody(base({ startsAt: "2026-06-10", endsAt: "2026-06-01" })),
      /Bitiş tarihi, başlangıç/,
    );
    const dated = readCampaignBody(base({ startsAt: "2026-06-01", endsAt: "2026-06-10" }));
    assert.ok(dated.startsAt && dated.endsAt);
  });
});

describe("qualifyingSubtotalKurus / cart totals", () => {
  it("sums the whole cart for subtotal and item count", () => {
    const c = cart(
      line({ productId: "a", priceKurus: 1000, quantity: 2 }),
      line({ productId: "b", priceKurus: 500, quantity: 3 }),
    );
    assert.equal(cartSubtotalKurus(c), 3500);
    assert.equal(cartItemCount(c), 5);
  });

  it("scopes to specific products", () => {
    const c = cart(
      line({ productId: "a", priceKurus: 1000, quantity: 2 }),
      line({ productId: "b", priceKurus: 500, quantity: 3 }),
    );
    const scoped = campaign({ scopeAll: false, productIds: ["a"] });
    assert.equal(qualifyingSubtotalKurus(scoped, c), 2000);
  });

  it("excludes sale items unless the campaign includes them", () => {
    const c = cart(line({ priceKurus: 1000, quantity: 1, onSale: true }));
    assert.equal(qualifyingSubtotalKurus(campaign(), c), 0);
    assert.equal(qualifyingSubtotalKurus(campaign({ includeSaleItems: true }), c), 1000);
  });
});

describe("campaignMatchesCart", () => {
  it("rejects an inactive campaign or one outside its date window", () => {
    const c = cart(line({}));
    assert.equal(campaignMatchesCart(campaign({ active: false }), c, NOW), false);
    assert.equal(
      campaignMatchesCart(campaign({ startsAt: "2026-07-01T00:00:00.000Z" }), c, NOW),
      false,
    );
    assert.equal(
      campaignMatchesCart(campaign({ endsAt: "2026-06-01T00:00:00.000Z" }), c, NOW),
      false,
    );
    assert.equal(
      campaignMatchesCart(
        campaign({ startsAt: "2026-06-01T00:00:00.000Z", endsAt: "2026-07-01T00:00:00.000Z" }),
        c,
        NOW,
      ),
      true,
    );
  });

  it("respects the automatic campaign's own usage cap, but not a code campaign's", () => {
    const c = cart(line({}));
    assert.equal(
      campaignMatchesCart(campaign({ usageLimitTotal: 1, usedCount: 1 }), c, NOW),
      false,
    );
    assert.equal(
      campaignMatchesCart(campaign({ usageLimitTotal: 2, usedCount: 1 }), c, NOW),
      true,
    );
  });

  it("checks the cart-wide requirements, not the scoped subtotal", () => {
    const c = cart(
      line({ productId: "a", priceKurus: 1000, quantity: 1 }),
      line({ productId: "b", priceKurus: 4000, quantity: 1 }),
    );
    const scoped = campaign({
      scopeAll: false,
      productIds: ["a"],
      minSubtotalKurus: 4000,
    });
    // "a" alone is only 1000, but the whole cart (5000) clears the requirement.
    assert.equal(campaignMatchesCart(scoped, c, NOW), true);
  });

  it("fails when nothing in the cart is in scope", () => {
    const c = cart(line({ productId: "a" }));
    const scoped = campaign({ scopeAll: false, productIds: ["z"] });
    assert.equal(campaignMatchesCart(scoped, c, NOW), false);
  });

  it("checks min/max subtotal and item count", () => {
    const c = cart(line({ priceKurus: 1000, quantity: 2 }));
    assert.equal(campaignMatchesCart(campaign({ minSubtotalKurus: 3000 }), c, NOW), false);
    assert.equal(campaignMatchesCart(campaign({ maxSubtotalKurus: 1000 }), c, NOW), false);
    assert.equal(campaignMatchesCart(campaign({ minItems: 3 }), c, NOW), false);
    assert.equal(campaignMatchesCart(campaign({ maxItems: 1 }), c, NOW), false);
    assert.equal(campaignMatchesCart(campaign({ minItems: 2, maxSubtotalKurus: 2000 }), c, NOW), true);
  });
});

describe("campaignDiscountKurus", () => {
  it("computes percent and fixed off the qualifying subtotal only", () => {
    const c = cart(
      line({ productId: "a", priceKurus: 1000, quantity: 1 }),
      line({ productId: "b", priceKurus: 4000, quantity: 1 }),
    );
    const percentAll = campaign({ discountType: "percent", percentOff: 10 });
    assert.equal(campaignDiscountKurus(percentAll, c), 500); // 10% of 5000

    const scopedFixed = campaign({
      discountType: "fixed",
      amountOffKurus: 2000,
      percentOff: null,
      scopeAll: false,
      productIds: ["a"],
    });
    // capped at the scoped subtotal (1000), not the fixed 2000
    assert.equal(campaignDiscountKurus(scopedFixed, c), 1000);
  });

  it("rounds percent down and is 0 for free shipping (handled separately)", () => {
    const c = cart(line({ priceKurus: 999, quantity: 1 }));
    const oddPercent = campaign({ percentOff: 33 });
    assert.equal(campaignDiscountKurus(oddPercent, c), Math.floor(999 * 0.33));
    assert.equal(
      campaignDiscountKurus(campaign({ discountType: "free_shipping", percentOff: null }), c),
      0,
    );
  });
});

describe("resolveAutomaticDiscount", () => {
  it("is empty when nothing matches", () => {
    const c = cart(line({}));
    assert.deepEqual(resolveAutomaticDiscount([], c, NOW), {
      campaigns: [],
      discountKurus: 0,
      freeShipping: false,
    });
  });

  it("picks the single best non-stackable campaign", () => {
    const c = cart(line({ priceKurus: 10_000, quantity: 1 }));
    const small = campaign({ id: "small", percentOff: 5 });
    const big = campaign({ id: "big", percentOff: 20 });
    const result = resolveAutomaticDiscount([small, big], c, NOW);
    assert.deepEqual(result.campaigns.map((entry) => entry.id), ["big"]);
    assert.equal(result.discountKurus, 2000);
  });

  it("combines every stackable match with the best non-stackable one", () => {
    const c = cart(line({ priceKurus: 10_000, quantity: 1 }));
    const exclusive = campaign({ id: "excl", percentOff: 10 });
    const stack1 = campaign({ id: "s1", stackable: true, discountType: "fixed", amountOffKurus: 300, percentOff: null });
    const stack2 = campaign({ id: "s2", stackable: true, discountType: "fixed", amountOffKurus: 200, percentOff: null });
    const result = resolveAutomaticDiscount([exclusive, stack1, stack2], c, NOW);
    assert.equal(result.discountKurus, 1000 + 300 + 200);
    assert.deepEqual(
      new Set(result.campaigns.map((entry) => entry.id)),
      new Set(["excl", "s1", "s2"]),
    );
  });

  it("never discounts past the cart subtotal", () => {
    const c = cart(line({ priceKurus: 1000, quantity: 1 }));
    const s1 = campaign({ id: "s1", stackable: true, percentOff: 80 });
    const s2 = campaign({ id: "s2", stackable: true, percentOff: 80 });
    const result = resolveAutomaticDiscount([s1, s2], c, NOW);
    assert.equal(result.discountKurus, 1000);
  });

  it("flags free shipping when an applied campaign grants it", () => {
    const c = cart(line({ priceKurus: 1000, quantity: 1 }));
    const shipping = campaign({
      id: "ship",
      stackable: true,
      discountType: "free_shipping",
      percentOff: null,
    });
    const result = resolveAutomaticDiscount([shipping], c, NOW);
    assert.equal(result.freeShipping, true);
    assert.equal(result.discountKurus, 0);
  });

  it("ignores code campaigns entirely", () => {
    const c = cart(line({ priceKurus: 1000, quantity: 1 }));
    const code = campaign({ kind: "code" });
    assert.deepEqual(resolveAutomaticDiscount([code], c, NOW).campaigns, []);
  });
});

describe("evaluateCodeRedemption", () => {
  function codeRow(overrides: Partial<TrDiscountCampaignCode> = {}): TrDiscountCampaignCode {
    return {
      id: "code1",
      campaignId: "c1",
      boutiqueId: "b1",
      code: "yaz10",
      usageLimitTotal: null,
      usageLimitPerCustomer: null,
      usedCount: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      ...overrides,
    };
  }

  it("redeems a matching code", () => {
    const c = cart(line({ priceKurus: 2000, quantity: 1 }));
    const result = evaluateCodeRedemption({
      campaign: campaign({ kind: "code", percentOff: 10 }),
      code: codeRow(),
      cart: c,
      customerPriorUses: 0,
      now: NOW,
    });
    assert.deepEqual(result, { ok: true, discountKurus: 200, freeShipping: false });
  });

  it("rejects an automatic campaign's code, or one outside its window", () => {
    const c = cart(line({}));
    const automatic = evaluateCodeRedemption({
      campaign: campaign({ kind: "automatic" }),
      code: codeRow(),
      cart: c,
      customerPriorUses: 0,
      now: NOW,
    });
    assert.equal(automatic.ok, false);

    const expired = evaluateCodeRedemption({
      campaign: campaign({ kind: "code", endsAt: "2026-01-01T00:00:00.000Z" }),
      code: codeRow(),
      cart: c,
      customerPriorUses: 0,
      now: NOW,
    });
    assert.equal(expired.ok, false);
  });

  it("enforces the code's own total and per-customer limits", () => {
    const c = cart(line({}));
    const atLimit = evaluateCodeRedemption({
      campaign: campaign({ kind: "code" }),
      code: codeRow({ usageLimitTotal: 5, usedCount: 5 }),
      cart: c,
      customerPriorUses: 0,
      now: NOW,
    });
    assert.equal(atLimit.ok, false);
    if (!atLimit.ok) assert.match(atLimit.error, /kullanım limiti doldu/);

    const usedByCustomer = evaluateCodeRedemption({
      campaign: campaign({ kind: "code" }),
      code: codeRow({ usageLimitPerCustomer: 1 }),
      cart: c,
      customerPriorUses: 1,
      now: NOW,
    });
    assert.equal(usedByCustomer.ok, false);
    if (!usedByCustomer.ok) assert.match(usedByCustomer.error, /daha önce kullandınız/);
  });

  it("free-shipping codes discount nothing but still flag shipping", () => {
    const c = cart(line({ priceKurus: 1000, quantity: 1 }));
    const result = evaluateCodeRedemption({
      campaign: campaign({ kind: "code", discountType: "free_shipping", percentOff: null }),
      code: codeRow(),
      cart: c,
      customerPriorUses: 0,
      now: NOW,
    });
    assert.deepEqual(result, { ok: true, discountKurus: 0, freeShipping: true });
  });
});
