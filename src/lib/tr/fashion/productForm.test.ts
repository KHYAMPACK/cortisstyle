import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fashionFormFacts,
  fashionFormFromProduct,
  fashionProductPatch,
  fashionProductStatus,
  fashionServerSavedFields,
  rebaseFashionForm,
  validateFashionProductForm,
  type FashionProductFormState,
} from "./productForm";
import type { TrSizeSource } from "@/lib/tr/sizeSources";
import type { TrProduct } from "@/types/tr-marketplace";

const LETTER_FULL = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const LETTER_TO_XL = ["XS", "S", "M", "L", "XL"];
const NUMERIC_TO_52 = [
  "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44", "46", "48", "50", "52",
];
const NUMERIC_TO_40 = ["24", "26", "28", "30", "32", "34", "36", "38", "40"];
const NUMERIC_NO_44 = NUMERIC_TO_52.filter((size) => size !== "44");

function stocksFor(sizes: string[], fill = (index: number) => index % 3): Record<string, number> {
  return Object.fromEntries(sizes.map((size, index) => [size, fill(index)]));
}

/** A garment shaped like lilabutik's rows (the fields the editor reads). */
function garment(overrides: Partial<TrProduct> = {}): TrProduct {
  const sizes = overrides.sizes ?? LETTER_FULL;
  const sizeStocks = overrides.sizeStocks ?? stocksFor(sizes);
  return {
    id: "p1",
    boutiqueId: "b1",
    title: "Saten Midi Elbise",
    description: "Saten kumaş, midi boy.",
    priceKurus: 189_900,
    compareAtPriceKurus: null,
    sizes,
    colors: [],
    category: "elbise",
    images: ["https://cdn.test/front.jpg", "https://cdn.test/back.jpg"],
    marketplaceImages: ["https://cdn.test/pack-front.png", ""],
    lifestyleImages: ["https://cdn.test/model-1.jpg"],
    catalogBackgroundId: "studio-white",
    features: { aiModelId: "boutique:lilabutik", color: "Siyah" },
    status: "available",
    stock: Object.values(sizeStocks).reduce((sum, n) => sum + n, 0),
    sizeStocks,
    productType: "fashion",
    ...overrides,
  } as TrProduct;
}

function form(overrides: Partial<FashionProductFormState> = {}): FashionProductFormState {
  return { ...fashionFormFromProduct(garment()), ...overrides };
}

describe("fashionFormFromProduct → fashionProductPatch (parity with the stored row)", () => {
  for (const [label, sizes] of [
    ["letter XS–3XL", LETTER_FULL],
    ["numeric 24–52", NUMERIC_TO_52],
    ["numeric 24–40", NUMERIC_TO_40],
    ["numeric 24–52 without 44", NUMERIC_NO_44],
  ] as const) {
    it(`re-saves an unedited ${label} garment unchanged`, () => {
      const product = garment({ sizes: [...sizes], sizeStocks: stocksFor([...sizes]) });
      const patch = fashionProductPatch(fashionFormFromProduct(product));
      assert.deepEqual(patch.sizes, product.sizes);
      assert.deepEqual(patch.sizeStocks, product.sizeStocks);
      assert.equal(patch.stock, product.stock);
      assert.equal(patch.priceTry, 1899);
      assert.equal(patch.compareAtPriceTry, null);
      assert.equal(patch.status, "available");
      assert.equal(patch.category, "elbise");
      assert.equal(patch.description, "Saten kumaş, midi boy.");
      assert.deepEqual(patch.images, product.images);
      assert.deepEqual(patch.lifestyleImages, product.lifestyleImages);
      assert.deepEqual(patch.features, product.features);
    });
  }

  it("keeps an XS–XL garment at XS–XL (no 2XL / 3XL added)", () => {
    const product = garment({ sizes: LETTER_TO_XL, sizeStocks: stocksFor(LETTER_TO_XL) });
    const loaded = fashionFormFromProduct(product);
    assert.deepEqual(Object.keys(loaded.sizeStockInputs), LETTER_TO_XL);
    const patch = fashionProductPatch(loaded);
    assert.deepEqual(patch.sizes, LETTER_TO_XL);
    assert.deepEqual(patch.sizeStocks, product.sizeStocks);
    assert.equal(patch.stock, product.stock);
  });

  it("keeps a custom size outside the chart", () => {
    const sizes = ["S", "M", "STD"];
    const patch = fashionProductPatch(
      fashionFormFromProduct(garment({ sizes, sizeStocks: stocksFor(sizes, () => 2) })),
    );
    assert.deepEqual(patch.sizes, ["S", "M", "STD"]);
    assert.equal(patch.stock, 6);
  });

  it("saves a size the owner added or removed", () => {
    const loaded = fashionFormFromProduct(
      garment({ sizes: LETTER_TO_XL, sizeStocks: stocksFor(LETTER_TO_XL, () => 1) }),
    );
    const added = fashionProductPatch({
      ...loaded,
      sizeStockInputs: { ...loaded.sizeStockInputs, "2XL": "3" },
    });
    assert.deepEqual(added.sizes, [...LETTER_TO_XL, "2XL"]);
    assert.equal(added.stock, 8);

    const withoutXs = { ...loaded.sizeStockInputs };
    delete withoutXs.XS;
    const removed = fashionProductPatch({ ...loaded, sizeStockInputs: withoutXs });
    assert.deepEqual(removed.sizes, ["S", "M", "L", "XL"]);
    assert.equal(removed.sizeStocks?.XS, undefined);
    assert.equal(removed.stock, 4);
  });

  it("keeps a discount as sale price + struck-through price", () => {
    const product = garment({ priceKurus: 99_950, compareAtPriceKurus: 149_900 });
    const loaded = fashionFormFromProduct(product);
    assert.equal(loaded.priceTry, "1499");
    assert.equal(loaded.salePriceTry, "999.50");
    const patch = fashionProductPatch(loaded);
    assert.equal(patch.priceTry, 999.5);
    assert.equal(patch.compareAtPriceTry, 1499);
  });

  it("sends the single stock and an empty size map for a garment without sizes", () => {
    const product = garment({ sizes: [], sizeStocks: {}, stock: 3 });
    const patch = fashionProductPatch(fashionFormFromProduct(product));
    assert.deepEqual(patch.sizes, []);
    assert.deepEqual(patch.sizeStocks, {});
    assert.equal(patch.stock, 3);
  });

  it("drops the colours when the colour switch is off", () => {
    const loaded = fashionFormFromProduct(
      garment({ colors: [{ name: "Siyah", hex: "#1A1A1A" }] }),
    );
    assert.equal(loaded.colorsEnabled, true);
    assert.deepEqual(fashionProductPatch({ ...loaded, colorsEnabled: false }).colors, []);
  });

  it("keeps the manual-listing marker in features", () => {
    const loaded = fashionFormFromProduct(
      garment({ features: { manualListing: true, aiModelId: "studio:ayla" } }),
    );
    assert.equal(loaded.manualMode, true);
    assert.equal(fashionProductPatch(loaded).features?.manualListing, true);
    assert.equal(
      fashionProductPatch({ ...loaded, manualMode: false }).features?.manualListing,
      undefined,
    );
  });
});

describe("with the boutique's own Beden types", () => {
  const sources: TrSizeSource[] = [
    {
      id: "beden-type",
      label: "Beden",
      hint: "S–L",
      values: ["S", "M", "L", "STD"],
      moreValues: [],
      moreLabel: null,
    },
  ];

  it("reads the garment against the type and saves in the type's order", () => {
    const product = garment({ sizes: ["STD", "S", "L"], sizeStocks: { STD: 1, S: 2, L: 0 } });
    const loaded = fashionFormFromProduct(product, sources);
    assert.equal(loaded.sizeChart, "beden-type");
    const patch = fashionProductPatch(loaded, sources);
    assert.deepEqual(patch.sizes, ["S", "L", "STD"]);
    assert.equal(patch.stock, 3);
  });
});

describe("stock and Durum", () => {
  it("saves 0 when every size is typed as 0 (the old editor kept the previous stock)", () => {
    const loaded = form();
    const zeroed = Object.fromEntries(
      Object.keys(loaded.sizeStockInputs).map((size) => [size, "0"]),
    );
    const patch = fashionProductPatch({ ...loaded, sizeStockInputs: zeroed });
    assert.equal(patch.stock, 0);
    assert.deepEqual(patch.sizeStocks, Object.fromEntries(LETTER_FULL.map((s) => [s, 0])));
    assert.equal(patch.status, "sold");
  });

  it("derives Satışta / Satıldı from stock and keeps Gizli as the owner's choice", () => {
    assert.equal(fashionProductStatus(form()), "available");
    assert.equal(
      fashionProductStatus(form({ sizeChart: "none", sizeStockInputs: {}, stock: "0" })),
      "sold",
    );
    assert.equal(fashionProductStatus(form({ hidden: true })), "hidden");
    assert.equal(
      fashionProductStatus(
        form({ hidden: true, sizeChart: "none", sizeStockInputs: {}, stock: "0" }),
      ),
      "hidden",
    );
  });

  it("reads a hidden product as hidden and anything else as not hidden", () => {
    assert.equal(fashionFormFromProduct(garment({ status: "hidden" })).hidden, true);
    assert.equal(fashionFormFromProduct(garment({ status: "sold" })).hidden, false);
  });
});

describe("validateFashionProductForm", () => {
  it("accepts a complete garment", () => {
    assert.equal(validateFashionProductForm(form()), null);
  });

  it("uses the old editor's messages, in its order", () => {
    assert.match(validateFashionProductForm(form({ priceTry: "" }))!, /Fiyat/);
    assert.match(validateFashionProductForm(form({ title: " " }))!, /Başlık/);
    assert.match(
      validateFashionProductForm(form({ images: ["https://cdn.test/front.jpg"] }))!,
      /Ön ve arka fotoğraf zorunlu\. Dekolte/,
    );
    assert.match(
      validateFashionProductForm(
        form({ sizeStockInputs: { ...form().sizeStockInputs, M: "abc" } }),
      )!,
      /Her beden/,
    );
    assert.match(
      validateFashionProductForm(form({ sizeChart: "none", sizeStockInputs: {}, stock: "" }))!,
      /^Stok/,
    );
    assert.match(
      validateFashionProductForm(form({ sizeStockInputs: {} }))!,
      /En az bir beden/,
    );
  });

  it("asks for a leaf category under üst giyim / alt giyim", () => {
    assert.match(validateFashionProductForm(form({ category: "ust-giyim" }))!, /Üst giyim/);
    assert.equal(validateFashionProductForm(form({ category: "bluz" })), null);
    assert.match(validateFashionProductForm(form({ category: "alt-giyim" }))!, /Alt giyim/);
  });

  it("needs one photo in manual mode and none for a takım", () => {
    assert.match(
      validateFashionProductForm(form({ manualMode: true, images: [] }))!,
      /En az bir fotoğraf/,
    );
    assert.equal(
      validateFashionProductForm(form({ manualMode: true, images: ["https://cdn.test/a.jpg"] })),
      null,
    );
    assert.equal(
      validateFashionProductForm(
        form({ images: [], features: { uploadKind: "takim" }, category: "takim" }),
      ),
      null,
    );
  });

  it("treats an empty discounted price as no discount, otherwise requires it valid and lower", () => {
    assert.equal(validateFashionProductForm(form({ salePriceTry: "  " })), null);
    assert.equal(fashionProductPatch(form({ salePriceTry: "" })).compareAtPriceTry, null);
    assert.match(
      validateFashionProductForm(form({ salePriceTry: "abc" }))!,
      /indirimli fiyat/,
    );
    assert.match(
      validateFashionProductForm(form({ salePriceTry: "1899" }))!,
      /düşük/,
    );
    assert.equal(
      validateFashionProductForm(form({ salePriceTry: "1499" })),
      null,
    );
  });
});

describe("fashionFormFacts", () => {
  it("recognises dresses, takım and plain garments", () => {
    assert.deepEqual(fashionFormFacts({ features: {}, category: "elbise" }), {
      takim: false,
      family: "elbise",
      elbise: true,
      requiredPhotoSlots: 2,
    });
    assert.equal(fashionFormFacts({ features: { uploadKind: "takim" }, category: "bluz" }).takim, true);
    assert.equal(fashionFormFacts({ features: {}, category: "takim" }).family, null);
  });
});

describe("rebaseFashionForm", () => {
  const baseline = form();

  it("takes what the server saved when the owner hasn't touched the field", () => {
    const saved = garment({ lifestyleImages: ["https://cdn.test/model-2.jpg"] });
    const next = rebaseFashionForm(
      { form: { ...baseline, title: "Yeni ad" }, baseline },
      fashionServerSavedFields(saved, ["lifestyleImages"]),
    );
    assert.deepEqual(next.form.lifestyleImages, ["https://cdn.test/model-2.jpg"]);
    assert.deepEqual(next.baseline.lifestyleImages, ["https://cdn.test/model-2.jpg"]);
    assert.equal(next.form.title, "Yeni ad");
    assert.equal(next.baseline.title, baseline.title);
  });

  it("keeps the owner's unsaved edit of the same field", () => {
    const edited = { ...baseline, images: ["https://cdn.test/other.jpg"] };
    const next = rebaseFashionForm(
      { form: edited, baseline },
      { images: ["https://cdn.test/server.jpg"] },
    );
    assert.deepEqual(next.form.images, ["https://cdn.test/other.jpg"]);
    assert.deepEqual(next.baseline.images, ["https://cdn.test/server.jpg"]);
  });

  it("merges features key by key", () => {
    const edited = {
      ...baseline,
      features: { ...baseline.features, fabric: "Saten" },
    };
    const next = rebaseFashionForm(
      { form: edited, baseline },
      { features: { ...baseline.features, aiModelId: "studio:selin", colorGroupId: "g1" } },
    );
    assert.deepEqual(next.form.features, {
      aiModelId: "studio:selin",
      color: "Siyah",
      colorGroupId: "g1",
      fabric: "Saten",
    });
    assert.deepEqual(next.baseline.features, {
      aiModelId: "studio:selin",
      color: "Siyah",
      colorGroupId: "g1",
    });
  });

  it("keeps a feature the owner removed", () => {
    const rest = { ...baseline.features };
    delete rest.color;
    const next = rebaseFashionForm(
      { form: { ...baseline, features: rest }, baseline },
      { features: { ...baseline.features, colorGroupId: "g1" } },
    );
    assert.equal(next.form.features.color, undefined);
    assert.equal(next.form.features.colorGroupId, "g1");
  });
});
