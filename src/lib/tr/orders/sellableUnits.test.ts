import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterSellableUnits,
  sellableUnitKey,
  sellableUnitsOf,
  sellableUnitsOfCatalog,
} from "@/lib/tr/orders/sellableUnits";
import type { TrProductVariant } from "@/lib/tr/variants/types";
import type { TrProduct } from "@/types/tr-marketplace";

function product(over: Partial<TrProduct> = {}): TrProduct {
  return {
    id: "p1",
    boutiqueId: "b1",
    title: "Keten Elbise",
    description: null,
    priceKurus: 100_000,
    compareAtPriceKurus: null,
    size: null,
    sizes: [],
    colors: [],
    conditionLabel: null,
    category: null,
    images: ["https://example.com/a.jpg"],
    marketplaceImages: [],
    storefrontImages: [],
    lifestyleImages: [],
    catalogBackgroundId: null,
    features: {},
    status: "available",
    stock: 4,
    sizeStocks: {},
    sortOrder: 0,
    createdAt: "",
    updatedAt: "",
    ...over,
  };
}

function variant(id: string, over: Partial<TrProductVariant> = {}): TrProductVariant {
  return {
    id,
    optionValueIds: ["red", "s"],
    sku: null,
    barcode: null,
    priceKurus: null,
    stock: 2,
    images: [],
    active: true,
    sortOrder: 0,
    ...over,
  };
}

const labelOf = (id: string) => ({ red: "Kırmızı", blue: "Mavi", s: "S", m: "M" })[id] ?? id;

describe("sellableUnitsOf", () => {
  it("is one unit for a product without options", () => {
    const units = sellableUnitsOf(product());
    assert.equal(units.length, 1);
    assert.deepEqual(
      [units[0]!.optionLabel, units[0]!.size, units[0]!.variantId, units[0]!.stock],
      [null, null, null, 4],
    );
  });

  it("is one unit per size, each with its own stock", () => {
    const units = sellableUnitsOf(
      product({ sizes: ["S", "M", "L"], sizeStocks: { S: 1, M: 0, L: 3 } }),
    );
    assert.deepEqual(
      units.map((unit) => [unit.optionLabel, unit.stock]),
      [
        ["S", 1],
        ["M", 0],
        ["L", 3],
      ],
    );
  });

  it("falls back to the product's stock for sizes without a per-size map", () => {
    const units = sellableUnitsOf(product({ sizes: ["S", "M"], stock: 5 }));
    assert.deepEqual(
      units.map((unit) => unit.stock),
      [5, 5],
    );
  });

  it("is one unit per active variant, labelled by its values", () => {
    const units = sellableUnitsOf(
      product(),
      [
        variant("v1"),
        variant("v2", { optionValueIds: ["blue", "m"], stock: 7 }),
        variant("v3", { active: false }),
      ],
      labelOf,
    );
    assert.deepEqual(
      units.map((unit) => [unit.variantId, unit.optionLabel, unit.size, unit.stock]),
      [
        ["v1", "Kırmızı / S", null, 2],
        ["v2", "Mavi / M", null, 7],
      ],
    );
  });

  it("prices a variant at its own price or the product's", () => {
    const units = sellableUnitsOf(
      product({ compareAtPriceKurus: 150_000 }),
      [variant("v1"), variant("v2", { priceKurus: 90_000 })],
      labelOf,
    );
    // Inherits the product's price and its strike-through...
    assert.equal(units[0]!.priceKurus, 100_000);
    assert.equal(units[0]!.compareAtKurus, 150_000);
    // ...its own price replaces both.
    assert.equal(units[1]!.priceKurus, 90_000);
    assert.equal(units[1]!.compareAtKurus, null);
  });

  it("strikes a compare-at price through only when it is higher", () => {
    assert.equal(sellableUnitsOf(product({ compareAtPriceKurus: 150_000 }))[0]!.compareAtKurus, 150_000);
    assert.equal(sellableUnitsOf(product({ compareAtPriceKurus: 100_000 }))[0]!.compareAtKurus, null);
    assert.equal(sellableUnitsOf(product({ compareAtPriceKurus: 50_000 }))[0]!.compareAtKurus, null);
  });

  it("lists a sold-out product (stock 0) but not a hidden one", () => {
    assert.equal(sellableUnitsOf(product({ status: "sold", stock: 0 }))[0]!.stock, 0);
    assert.deepEqual(sellableUnitsOf(product({ status: "hidden" })), []);
  });

  it("gives every unit its own key", () => {
    const units = sellableUnitsOf(product({ sizes: ["S", "M"] }));
    assert.equal(new Set(units.map((unit) => unit.key)).size, 2);
    assert.equal(units[0]!.key, sellableUnitKey("p1", "S", null));
  });
});

describe("sellableUnitsOfCatalog", () => {
  it("keeps the product order and gives each product its variants", () => {
    const units = sellableUnitsOfCatalog(
      [product({ id: "a", title: "A" }), product({ id: "b", title: "B" })],
      new Map([["b", [variant("v1")]]]),
      labelOf,
    );
    assert.deepEqual(
      units.map((unit) => [unit.productId, unit.variantId]),
      [
        ["a", null],
        ["b", "v1"],
      ],
    );
  });
});

describe("filterSellableUnits", () => {
  const units = sellableUnitsOfCatalog(
    [
      product({ id: "a", title: "Keten Elbise", sizes: ["S", "M"] }),
      product({ id: "b", title: "Saten Gömlek" }),
    ],
    new Map(),
  );

  it("keeps everything for an empty query", () => {
    assert.equal(filterSellableUnits(units, "").length, 3);
    assert.equal(filterSellableUnits(units, "   ").length, 3);
  });

  it("matches the product name, ignoring Turkish letter case", () => {
    assert.deepEqual(
      filterSellableUnits(units, "ELBISE").map((unit) => unit.productId),
      ["a", "a"],
    );
    assert.deepEqual(
      filterSellableUnits(units, "gömlek").map((unit) => unit.productId),
      ["b"],
    );
  });

  it("matches the option too, and needs every word", () => {
    assert.deepEqual(
      filterSellableUnits(units, "elbise m").map((unit) => unit.optionLabel),
      ["M"],
    );
    assert.equal(filterSellableUnits(units, "elbise gömlek").length, 0);
  });
});
