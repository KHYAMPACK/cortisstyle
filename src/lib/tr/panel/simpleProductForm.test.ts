import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptySimpleProductForm,
  simpleFormFromProduct,
  simpleProductPatch,
  simpleProductPayload,
  simpleProductStatus,
  validateSimpleProductForm,
  type SimpleProductFormState,
} from "./simpleProductForm";
import type { TrProduct } from "@/types/tr-marketplace";

function form(
  overrides: Partial<SimpleProductFormState> = {},
): SimpleProductFormState {
  return {
    ...emptySimpleProductForm(),
    title: "Deri cüzdan",
    priceTry: "450",
    images: ["https://cdn.test/a.jpg"],
    ...overrides,
  };
}

describe("validateSimpleProductForm", () => {
  it("accepts a complete form", () => {
    assert.equal(validateSimpleProductForm(form()), null);
  });

  it("asks for the essentials in order", () => {
    assert.match(validateSimpleProductForm(form({ title: "  " }))!, /adı/);
    assert.match(
      validateSimpleProductForm(form({ priceTry: "" }))!,
      /Satış fiyatı/,
    );
    assert.match(validateSimpleProductForm(form({ stock: "" }))!, /Stok/);
    assert.match(validateSimpleProductForm(form({ images: [] }))!, /fotoğraf/);
  });

  it("requires the discounted price to be lower than the price", () => {
    assert.match(
      validateSimpleProductForm(form({ salePriceTry: "450" }))!,
      /düşük/,
    );
    assert.equal(
      validateSimpleProductForm(form({ salePriceTry: "399,90" })),
      null,
    );
  });

  it("treats the cost price as optional but rejects nonsense", () => {
    assert.equal(validateSimpleProductForm(form({ costPriceTry: "" })), null);
    assert.equal(
      validateSimpleProductForm(form({ costPriceTry: "120" })),
      null,
    );
    assert.match(
      validateSimpleProductForm(form({ costPriceTry: "abc" }))!,
      /Alış/,
    );
    assert.match(
      validateSimpleProductForm(form({ costPriceTry: "0" }))!,
      /Alış/,
    );
  });
});

describe("simpleProductPayload", () => {
  it("sends the normal price alone when there is no discount", () => {
    const payload = simpleProductPayload(form(), "b1");
    assert.equal(payload.productType, "simple");
    assert.equal(payload.priceTry, 450);
    assert.equal(payload.compareAtPriceTry, null);
    assert.equal(payload.costPriceTry, null);
    assert.deepEqual(payload.sizes, []);
    assert.equal(payload.category, null);
  });

  it("makes the discounted price the sell price and the normal price the struck one", () => {
    const payload = simpleProductPayload(
      form({ salePriceTry: "399,90" }),
      "b1",
    );
    assert.equal(payload.priceTry, 399.9);
    assert.equal(payload.compareAtPriceTry, 450);
  });

  it("carries the cost price and the fulfillment type", () => {
    const payload = simpleProductPayload(
      form({ costPriceTry: "120", fulfillmentType: "digital" }),
      "b1",
    );
    assert.equal(payload.costPriceTry, 120);
    assert.equal(payload.fulfillmentType, "digital");
  });
});

describe("simpleProductPatch", () => {
  it("only carries the fields the editor owns", () => {
    const patch = simpleProductPatch(form({ costPriceTry: "120" }));
    assert.deepEqual(Object.keys(patch).sort(), [
      "compareAtPriceTry",
      "costPriceTry",
      "fulfillmentType",
      "images",
      "priceTry",
      "status",
      "stock",
      "title",
    ]);
    assert.equal(patch.costPriceTry, 120);
  });

  it("clears the cost price when the field is emptied", () => {
    assert.equal(simpleProductPatch(form()).costPriceTry, null);
  });
});

describe("simpleProductStatus", () => {
  it("is hidden when the owner hides it, sold at zero stock, otherwise available", () => {
    assert.equal(simpleProductStatus(form({ hidden: true })), "hidden");
    assert.equal(simpleProductStatus(form({ stock: "0" })), "sold");
    assert.equal(simpleProductStatus(form({ stock: "3" })), "available");
  });
});

describe("simpleFormFromProduct", () => {
  const product = {
    title: "Deri cüzdan",
    priceKurus: 39990,
    compareAtPriceKurus: 45000,
    status: "available",
    stock: 4,
    images: ["https://cdn.test/a.jpg"],
    fulfillmentType: "physical",
  } as TrProduct;

  it("turns a discounted product back into normal + discounted price", () => {
    const state = simpleFormFromProduct(product, { costPriceKurus: 12000 });
    assert.equal(state.priceTry, "450");
    assert.equal(state.salePriceTry, "399.90");
    assert.equal(state.costPriceTry, "120");
    assert.equal(state.stock, "4");
    assert.equal(state.hidden, false);
  });

  it("round-trips through the payload", () => {
    const state = simpleFormFromProduct(product, { costPriceKurus: null });
    const payload = simpleProductPayload(state, "b1");
    assert.equal(Math.round(payload.priceTry * 100), 39990);
    assert.equal(Math.round(payload.compareAtPriceTry! * 100), 45000);
  });
});
