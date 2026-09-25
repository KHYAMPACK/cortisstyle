import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { orderItemOption } from "@/lib/tr/orderItemOption";

describe("orderItemOption", () => {
  it("shows a variant's label", () => {
    assert.deepEqual(orderItemOption({ size: null, variantLabel: "Kırmızı / S" }), {
      label: "Varyant",
      value: "Kırmızı / S",
    });
  });

  it("shows the size when there is no variant", () => {
    assert.deepEqual(orderItemOption({ size: "M", variantLabel: null }), {
      label: "Beden",
      value: "M",
    });
  });

  it("prefers the variant when both are present", () => {
    assert.equal(
      orderItemOption({ size: "M", variantLabel: "Mavi / M" })?.label,
      "Varyant",
    );
  });

  it("is null for a line with neither", () => {
    assert.equal(orderItemOption({ size: null, variantLabel: null }), null);
  });
});
