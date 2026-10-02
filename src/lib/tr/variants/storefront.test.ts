import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  galleryForSelection,
  initialSelection,
  isValueAvailable,
  pickValue,
  priceRange,
  publicVariantLabel,
  selectedVariant,
  toPublicVariant,
  valueParam,
  type TrPublicVariants,
} from "./storefront";

const data: TrPublicVariants = {
  options: [
    {
      typeId: "renk",
      name: "Renk",
      role: "color",
      selectionStyle: "swatch",
      values: [
        { id: "kirmizi", label: "Kırmızı", hex: "#b71c1c", imageUrl: null },
        { id: "acik-mavi", label: "Açık Mavi", hex: "#90caf9", imageUrl: null },
      ],
    },
    {
      typeId: "beden",
      name: "Beden",
      role: "size",
      selectionStyle: "list",
      values: [
        { id: "s", label: "S", hex: null, imageUrl: null },
        { id: "m", label: "M", hex: null, imageUrl: null },
      ],
    },
  ],
  variants: [
    { id: "v1", optionValueIds: ["kirmizi", "s"], priceKurus: 1000, compareAtPriceKurus: null, stock: 0, images: ["r1", "r2"] },
    { id: "v2", optionValueIds: ["kirmizi", "m"], priceKurus: 1000, compareAtPriceKurus: null, stock: 3, images: ["r2", "r3"] },
    { id: "v3", optionValueIds: ["acik-mavi", "s"], priceKurus: 1200, compareAtPriceKurus: null, stock: 1, images: ["b1"] },
  ],
};

describe("storefront variants", () => {
  it("disables a value that has no stock with the other choices", () => {
    assert.equal(isValueAvailable(data, { renk: "kirmizi" }, "beden", "s"), false);
    assert.equal(isValueAvailable(data, { renk: "kirmizi" }, "beden", "m"), true);
    assert.equal(isValueAvailable(data, {}, "beden", "s"), true);
    assert.equal(isValueAvailable(data, { renk: "acik-mavi" }, "beden", "m"), false);
  });

  it("names a variant only once every option is chosen", () => {
    assert.equal(selectedVariant(data, { renk: "kirmizi" }), null);
    assert.equal(selectedVariant(data, { renk: "kirmizi", beden: "m" })?.id, "v2");
  });

  it("drops a choice the new colour can't sell", () => {
    assert.deepEqual(pickValue(data, { renk: "acik-mavi", beden: "s" }, "renk", "kirmizi"), {
      renk: "kirmizi",
    });
    assert.deepEqual(pickValue(data, { renk: "kirmizi", beden: "m" }, "beden", "m"), {
      renk: "kirmizi",
      beden: "m",
    });
  });

  it("starts from ?renk= or the first colour in stock, and a lone sellable size", () => {
    assert.deepEqual(initialSelection(data), { renk: "kirmizi", beden: "m" });
    assert.deepEqual(initialSelection(data, "acik-mavi"), { renk: "acik-mavi", beden: "s" });
    assert.deepEqual(initialSelection(data, "yok"), { renk: "kirmizi", beden: "m" });
  });

  it("shows the chosen colour's photos, else the product's", () => {
    assert.deepEqual(galleryForSelection(data, { renk: "kirmizi" }, ["p"]), ["r1", "r2", "r3"]);
    assert.deepEqual(galleryForSelection(data, {}, ["p"]), ["p"]);
    const noPhotos = {
      ...data,
      variants: data.variants.map((variant) => ({ ...variant, images: [] })),
    };
    assert.deepEqual(galleryForSelection(noPhotos, { renk: "kirmizi" }, ["p"]), ["p"]);
  });

  it("labels, prices and addresses", () => {
    assert.equal(publicVariantLabel(data, data.variants[2]!), "Açık Mavi / S");
    assert.deepEqual(priceRange(data), { min: 1000, varies: true });
    assert.equal(valueParam("Açık Mavi"), "acik-mavi");
    assert.equal(valueParam("Çok Renkli"), "cok-renkli");
  });

  it("a variant's own price replaces the product's discount", () => {
    const product = { priceKurus: 800, compareAtPriceKurus: 1000 };
    const inherits = toPublicVariant(
      { id: "a", optionValueIds: [], priceKurus: null, stock: 1, images: [] },
      product,
    );
    assert.equal(inherits.priceKurus, 800);
    assert.equal(inherits.compareAtPriceKurus, 1000);
    const own = toPublicVariant(
      { id: "b", optionValueIds: [], priceKurus: 900, stock: -2, images: [] },
      product,
    );
    assert.equal(own.priceKurus, 900);
    assert.equal(own.compareAtPriceKurus, null);
    assert.equal(own.stock, 0);
  });
});
