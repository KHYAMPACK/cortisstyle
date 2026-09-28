import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ManualLine } from "@/lib/tr/orders/manualOrder";
import { priceManualLine } from "@/lib/tr/orders/priceManualLine";
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
    images: [],
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

const labelOf = (id: string) => ({ red: "Kırmızı", s: "S" })[id] ?? id;

function price(args: {
  product?: TrProduct | undefined | null;
  variants?: TrProductVariant[];
  line?: Partial<ManualLine>;
  enforceStock?: boolean;
}) {
  return priceManualLine({
    product: args.product === null ? undefined : (args.product ?? product()),
    boutiqueId: "b1",
    variants: args.variants ?? [],
    labelOf,
    line: { productId: "p1", size: null, variantId: null, quantity: 1, ...args.line },
    enforceStock: args.enforceStock ?? true,
  });
}

function error(result: ReturnType<typeof price>): string {
  assert.equal(result.ok, false);
  return result.ok ? "" : result.error;
}

describe("priceManualLine — plain product", () => {
  it("prices at the product's price", () => {
    const result = price({ line: { quantity: 3 } });
    assert.ok(result.ok);
    assert.deepEqual(result.line, {
      productId: "p1",
      boutiqueId: "b1",
      title: "Keten Elbise",
      priceKurus: 100_000,
      quantity: 3,
      size: null,
      variantId: null,
      variantLabel: null,
    });
  });

  it("allows exactly the stock, refuses one more", () => {
    assert.ok(price({ line: { quantity: 4 } }).ok);
    assert.match(error(price({ line: { quantity: 5 } })), /stokta yok/);
  });

  it("refuses an unknown product and another boutique's product", () => {
    assert.match(error(price({ product: null })), /bulunamadı/);
    assert.match(error(price({ product: product({ boutiqueId: "b2" }) })), /bulunamadı/);
  });

  it("refuses a sold or hidden product when creating", () => {
    assert.match(error(price({ product: product({ status: "sold" }) })), /satışta değil/);
    assert.match(error(price({ product: product({ status: "hidden" }) })), /satışta değil/);
  });

  it("refuses a size or a variant the product does not have", () => {
    assert.match(error(price({ line: { size: "M" } })), /beden/);
    assert.match(error(price({ line: { variantId: "v1" } })), /seçenek/);
  });
});

describe("priceManualLine — sizes", () => {
  const sized = product({ sizes: ["S", "M"], sizeStocks: { S: 0, M: 2 } });

  it("requires a size of the product, ignoring letter case", () => {
    assert.match(error(price({ product: sized })), /beden seçin/);
    assert.match(error(price({ product: sized, line: { size: "XL" } })), /beden seçin/);
    const result = price({ product: sized, line: { size: "m" } });
    assert.ok(result.ok);
    assert.equal(result.line.size, "M");
  });

  it("checks that size's own stock", () => {
    assert.match(error(price({ product: sized, line: { size: "S" } })), /\(S\) stokta yok/);
    assert.ok(price({ product: sized, line: { size: "M", quantity: 2 } }).ok);
    assert.match(error(price({ product: sized, line: { size: "M", quantity: 3 } })), /stokta yok/);
  });

  it("falls back to the product's stock without a per-size map", () => {
    const noMap = product({ sizes: ["S", "M"], stock: 3 });
    assert.ok(price({ product: noMap, line: { size: "S", quantity: 3 } }).ok);
  });
});

describe("priceManualLine — variants", () => {
  it("requires a variant when the product has some", () => {
    assert.match(error(price({ variants: [variant("v1")] })), /seçenek belirleyin/);
  });

  it("prices at the variant's price or the product's, and keeps its label", () => {
    const own = price({
      variants: [variant("v1", { priceKurus: 125_000 })],
      line: { variantId: "v1" },
    });
    assert.ok(own.ok);
    assert.equal(own.line.priceKurus, 125_000);
    assert.equal(own.line.variantLabel, "Kırmızı / S");
    assert.equal(own.line.size, null);

    const inherited = price({ variants: [variant("v1")], line: { variantId: "v1" } });
    assert.ok(inherited.ok);
    assert.equal(inherited.line.priceKurus, 100_000);
  });

  it("checks the variant's stock and that it is active", () => {
    const line = { variantId: "v1", quantity: 3 };
    assert.match(error(price({ variants: [variant("v1", { stock: 2 })], line })), /stokta yok/);
    assert.match(
      error(price({ variants: [variant("v1", { active: false })], line: { variantId: "v1" } })),
      /satışta değil/,
    );
  });
});

describe("priceManualLine — drafts (no stock check)", () => {
  it("prices a line that is out of stock or on a sold product", () => {
    assert.ok(price({ enforceStock: false, line: { quantity: 50 } }).ok);
    assert.ok(price({ enforceStock: false, product: product({ status: "sold", stock: 0 }) }).ok);
    assert.ok(
      price({
        enforceStock: false,
        variants: [variant("v1", { stock: 0 })],
        line: { variantId: "v1", quantity: 9 },
      }).ok,
    );
  });

  it("still refuses what no longer exists", () => {
    assert.equal(price({ enforceStock: false, product: null }).ok, false);
    assert.equal(
      price({ enforceStock: false, product: product({ status: "hidden" }) }).ok,
      false,
    );
    assert.equal(
      price({ enforceStock: false, variants: [variant("v1")], line: { variantId: "gone" } }).ok,
      false,
    );
    assert.equal(
      price({
        enforceStock: false,
        variants: [variant("v1", { active: false })],
        line: { variantId: "v1" },
      }).ok,
      false,
    );
  });
});
