import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { productTypeLabel, productTypesForProfile } from "./registry";

describe("productTypesForProfile", () => {
  it("offers Basit ürün first and the fashion type to fashion boutiques", () => {
    const types = productTypesForProfile("fashion");
    assert.deepEqual(
      types.map((entry) => entry.id),
      ["simple", "fashion"],
    );
    assert.equal(types[0]?.createPath, "/tr/panel/urun/yeni/basit");
    assert.equal(types[1]?.createPath, "/tr/panel/urun/yeni/moda");
  });

  it("offers nothing to print-on-demand boutiques (their products stay hidden)", () => {
    assert.deepEqual(productTypesForProfile("custom_art"), []);
  });
});

describe("productTypeLabel", () => {
  it("treats a missing type as fashion", () => {
    assert.equal(productTypeLabel(undefined), "Moda ürünü");
    assert.equal(productTypeLabel("simple"), "Basit ürün");
  });
});
