import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  inventoryLineOf,
  inventoryLinesOf,
} from "@/lib/tr/commerce/inventoryLines";

const BASE = {
  productId: "p1",
  size: null,
  quantity: 2,
  variantId: null,
  variantLabel: null,
};

describe("inventoryLineOf", () => {
  it("keeps size and quantity for an ordinary line", () => {
    assert.deepEqual(inventoryLineOf({ ...BASE, size: "M" }), {
      productId: "p1",
      size: "M",
      quantity: 2,
    });
  });

  it("marks a variant line with its variant id", () => {
    assert.deepEqual(
      inventoryLineOf({ ...BASE, variantId: "v1", variantLabel: "Kırmızı / S" }),
      { productId: "p1", size: null, quantity: 2, variant: { id: "v1" } },
    );
  });

  it("keeps a line whose variant was removed as a variant line without an id", () => {
    assert.deepEqual(inventoryLineOf({ ...BASE, variantLabel: "Kırmızı / S" }), {
      productId: "p1",
      size: null,
      quantity: 2,
      variant: { id: null },
    });
  });

  it("has no line for a deleted product", () => {
    assert.equal(inventoryLineOf({ ...BASE, productId: null }), null);
  });
});

describe("inventoryLinesOf", () => {
  it("drops deleted products and keeps the rest in order", () => {
    const lines = inventoryLinesOf([
      { ...BASE, productId: "a" },
      { ...BASE, productId: null },
      { ...BASE, productId: "b", variantId: "v1", variantLabel: "M" },
    ]);
    assert.deepEqual(
      lines.map((line) => line.productId),
      ["a", "b"],
    );
  });
});
