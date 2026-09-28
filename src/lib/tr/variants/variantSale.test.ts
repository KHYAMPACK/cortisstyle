import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveVariantSale } from "@/lib/tr/variants/variantSale";
import type { TrProductVariant } from "@/lib/tr/variants/types";

const LABELS: Record<string, string> = { red: "Kırmızı", blue: "Mavi", s: "S", m: "M" };
const labelOf = (id: string) => LABELS[id] ?? id;

function variant(over: Partial<TrProductVariant> & { id: string }): TrProductVariant {
  return {
    optionValueIds: ["red", "s"],
    sku: null,
    barcode: null,
    priceKurus: null,
    stock: 3,
    images: [],
    active: true,
    sortOrder: 0,
    ...over,
  };
}

function sale(over: {
  variants?: TrProductVariant[];
  variantId?: string | null;
  quantity?: number;
}) {
  return resolveVariantSale({
    productTitle: "Keten Elbise",
    productPriceKurus: 100_000,
    variants: over.variants ?? [],
    variantId: over.variantId,
    quantity: over.quantity ?? 1,
    labelOf,
  });
}

describe("resolveVariantSale", () => {
  it("sells a product without variants at product level", () => {
    assert.deepEqual(sale({}), { kind: "product" });
    assert.deepEqual(sale({ variantId: "  " }), { kind: "product" });
  });

  it("refuses a variant for a product that has none", () => {
    const result = sale({ variantId: "v1" });
    assert.equal(result.kind, "error");
  });

  it("requires a variant once the product has variants", () => {
    const result = sale({ variants: [variant({ id: "v1" })] });
    assert.deepEqual(result, {
      kind: "error",
      error: '"Keten Elbise" için seçenek belirleyin.',
    });
  });

  it("refuses a variant that belongs to another product", () => {
    const result = sale({ variants: [variant({ id: "v1" })], variantId: "other" });
    assert.deepEqual(result, {
      kind: "error",
      error: '"Keten Elbise" için geçersiz seçenek.',
    });
  });

  it("refuses an inactive variant and names it", () => {
    const result = sale({
      variants: [variant({ id: "v1", active: false })],
      variantId: "v1",
    });
    assert.deepEqual(result, {
      kind: "error",
      error: '"Keten Elbise" (Kırmızı / S) satışta değil.',
    });
  });

  it("refuses more than the variant's stock, allows exactly its stock", () => {
    const variants = [variant({ id: "v1", stock: 2 })];
    assert.deepEqual(sale({ variants, variantId: "v1", quantity: 3 }), {
      kind: "error",
      error: '"Keten Elbise" (Kırmızı / S) stokta yok.',
    });
    assert.equal(sale({ variants, variantId: "v1", quantity: 2 }).kind, "variant");
  });

  it("refuses a variant with no stock left", () => {
    const result = sale({ variants: [variant({ id: "v1", stock: 0 })], variantId: "v1" });
    assert.equal(result.kind, "error");
  });

  it("uses the variant's own price when it has one", () => {
    const result = sale({
      variants: [variant({ id: "v1", priceKurus: 125_000 })],
      variantId: "v1",
    });
    assert.ok(result.kind === "variant");
    assert.equal(result.priceKurus, 125_000);
    assert.equal(result.label, "Kırmızı / S");
  });

  it("inherits the product's price when the variant has none", () => {
    const result = sale({ variants: [variant({ id: "v1" })], variantId: "v1" });
    assert.ok(result.kind === "variant");
    assert.equal(result.priceKurus, 100_000);
  });

  it("picks the right variant among several", () => {
    const variants = [
      variant({ id: "v1", optionValueIds: ["red", "s"] }),
      variant({ id: "v2", optionValueIds: ["blue", "m"], priceKurus: 90_000 }),
    ];
    const result = sale({ variants, variantId: " v2 " });
    assert.ok(result.kind === "variant");
    assert.equal(result.variant.id, "v2");
    assert.equal(result.label, "Mavi / M");
    assert.equal(result.priceKurus, 90_000);
  });
});
