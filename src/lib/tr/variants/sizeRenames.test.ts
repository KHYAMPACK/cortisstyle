import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  readSizeRenamesBody,
  renameProductSizes,
  sizeRenameOffers,
  sizeRenamesFromUpdate,
} from "./sizeRenames";

describe("size renames", () => {
  it("finds the values a save renames (by id), ignoring new and unchanged ones", () => {
    const stored = [
      { id: "a", label: "2XL" },
      { id: "b", label: "M" },
    ];
    assert.deepEqual(
      sizeRenamesFromUpdate(stored, [
        { id: "a", label: "XXL" },
        { id: "b", label: "M" },
        { label: "4XL" },
      ]),
      [{ from: "2XL", to: "XXL" }],
    );
  });

  it("offers only renames that products use, with their count", () => {
    const products = [{ sizes: ["S", "2XL"] }, { sizes: ["2XL "] }, { sizes: ["M"] }];
    assert.deepEqual(
      sizeRenameOffers(
        [
          { from: "2XL", to: "XXL" },
          { from: "3XL", to: "XXXL" },
        ],
        products,
      ),
      [{ from: "2XL", to: "XXL", productCount: 2 }],
    );
  });

  it("renames a product's sizes and keeps its stock", () => {
    assert.deepEqual(
      renameProductSizes(["S", "2XL"], { S: 1, "2XL": 3 }, [{ from: "2XL", to: "XXL" }]),
      { sizes: ["S", "XXL"], sizeStocks: { S: 1, XXL: 3 }, changed: true },
    );
  });

  it("handles swaps and merges into an existing size without losing stock", () => {
    assert.deepEqual(
      renameProductSizes(
        ["S", "M"],
        { S: 1, M: 2 },
        [
          { from: "S", to: "M" },
          { from: "M", to: "S" },
        ],
      ).sizeStocks,
      { M: 1, S: 2 },
    );
    const merged = renameProductSizes(["L", "XL"], { L: 1, XL: 2 }, [{ from: "XL", to: "L" }]);
    assert.deepEqual(merged, { sizes: ["L"], sizeStocks: { L: 3 }, changed: true });
  });

  it("reports no change for a product without the old size", () => {
    assert.equal(renameProductSizes(["S"], { S: 1 }, [{ from: "M", to: "Medium" }]).changed, false);
  });

  it("validates the request body", () => {
    assert.deepEqual(readSizeRenamesBody([{ from: " 2XL ", to: "XXL" }]), [
      { from: "2XL", to: "XXL" },
    ]);
    assert.throws(() => readSizeRenamesBody([]), /beden yok/);
    assert.throws(() => readSizeRenamesBody([{ from: "S", to: "S" }]), /geçersiz/);
  });
});
