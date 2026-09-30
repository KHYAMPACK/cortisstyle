import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  missingChartSizes,
  sizesFromStockInputs,
  sizesInStockInputs,
  stockInputsForProductSizes,
} from "./sizeStockInputs";

describe("size stock inputs", () => {
  const xsToXl = stockInputsForProductSizes(["XS", "S", "M", "L", "XL"], {
    XS: 1,
    S: 0,
    M: 2,
    L: 0,
    XL: 4,
  });

  it("keeps exactly the product's sizes, in order", () => {
    assert.deepEqual(xsToXl, { XS: "1", S: "0", M: "2", L: "0", XL: "4" });
    assert.deepEqual(sizesInStockInputs({ L: "1", XS: "0", M: "2" }), ["XS", "M", "L"]);
  });

  it("offers the chart's missing sizes", () => {
    assert.deepEqual(missingChartSizes("letter", xsToXl), ["2XL", "3XL"]);
    assert.deepEqual(missingChartSizes("none", xsToXl), []);
  });

  it("still fills the whole chart for the create flows", () => {
    assert.deepEqual(sizesFromStockInputs("letter", xsToXl), [
      "XS", "S", "M", "L", "XL", "2XL", "3XL",
    ]);
  });

  it("reads a missing size stock as 0", () => {
    assert.deepEqual(stockInputsForProductSizes(["S", " ", "M"], { S: 3 }), { S: "3", M: "0" });
  });
});
