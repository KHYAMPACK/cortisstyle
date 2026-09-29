import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  campaignFormFromCampaign,
  campaignInput,
  emptyCampaignForm,
  validateCampaignForm,
  type CampaignFormState,
} from "./campaignForm";
import type { TrDiscountCampaign } from "@/lib/tr/discounts/types";

function form(overrides: Partial<CampaignFormState> = {}): CampaignFormState {
  return { ...emptyCampaignForm(), title: "Yaz İndirimi", percentOff: "20", ...overrides };
}

describe("validateCampaignForm", () => {
  it("passes a minimal percent campaign", () => {
    assert.equal(validateCampaignForm(form()), null);
  });

  it("needs a title", () => {
    assert.match(validateCampaignForm(form({ title: "  " }))!, /başlığı/);
  });

  it("needs the rate that matches the discount type", () => {
    assert.match(
      validateCampaignForm(form({ discountType: "percent", percentOff: "" }))!,
      /oranı/,
    );
    assert.match(
      validateCampaignForm(form({ discountType: "fixed", amountOffTry: "" }))!,
      /tutarı/,
    );
    assert.equal(validateCampaignForm(form({ discountType: "free_shipping" })), null);
  });

  it("needs at least one product when scoped to specific products", () => {
    assert.match(validateCampaignForm(form({ scopeAll: false }))!, /ürün/);
    assert.equal(
      validateCampaignForm(form({ scopeAll: false, productIds: ["p1"] })),
      null,
    );
  });

  it("rejects a usage limit on a code campaign", () => {
    assert.match(
      validateCampaignForm(form({ kind: "code", usageLimitTotal: "10" }))!,
      /kuponlarda/,
    );
  });
});

describe("campaignInput", () => {
  it("converts TRY strings to kuruş and blanks to null", () => {
    const input = campaignInput(
      form({ discountType: "fixed", percentOff: "", amountOffTry: "10,50" }),
    );
    assert.equal(input.amountOffKurus, 1050);
    assert.equal(input.percentOff, null);
    assert.equal(input.minSubtotalKurus, null);
  });

  it("only sends the rate field that matches the discount type", () => {
    const percent = campaignInput(form({ discountType: "percent", percentOff: "15" }));
    assert.equal(percent.percentOff, 15);
    assert.equal(percent.amountOffKurus, null);

    const free = campaignInput(form({ discountType: "free_shipping" }));
    assert.equal(free.percentOff, null);
    assert.equal(free.amountOffKurus, null);
  });

  it("empties the product scope when scopeAll", () => {
    const input = campaignInput(form({ scopeAll: true, productIds: ["p1"] }));
    assert.deepEqual(input.productIds, []);
  });

  it("passes datetime-local strings through as-is, and blank as null", () => {
    assert.equal(campaignInput(form())["startsAt"], null);
    assert.equal(
      campaignInput(form({ startsAt: "2026-09-29T10:00" }))["startsAt"],
      "2026-09-29T10:00",
    );
  });
});

describe("campaignFormFromCampaign", () => {
  it("loads a saved campaign into the form, kuruş as TRY strings", () => {
    const campaign: TrDiscountCampaign = {
      id: "c1",
      boutiqueId: "b1",
      kind: "automatic",
      title: "Yaz İndirimi",
      discountType: "fixed",
      percentOff: null,
      amountOffKurus: 1050,
      scopeAll: false,
      productIds: ["p1", "p2"],
      includeSaleItems: true,
      minSubtotalKurus: 50_00,
      maxSubtotalKurus: null,
      minItems: null,
      maxItems: null,
      stackable: true,
      usageLimitTotal: 100,
      usageLimitPerCustomer: null,
      usedCount: 3,
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: null,
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const state = campaignFormFromCampaign(campaign);
    assert.equal(state.amountOffTry, "10.50");
    assert.equal(state.minSubtotalTry, "50");
    assert.deepEqual(state.productIds, ["p1", "p2"]);
    assert.equal(state.includeSaleItems, true);
    assert.equal(state.stackable, true);
    assert.equal(state.usageLimitTotal, "100");
    assert.equal(state.endsAt, "");
    assert.match(state.startsAt, /^2026-01-01T\d{2}:00$/);
  });
});
