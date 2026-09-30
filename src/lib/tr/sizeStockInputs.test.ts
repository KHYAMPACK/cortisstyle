import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BUILT_IN_SIZE_SOURCES,
  detectSizeSourceId,
  findSizeSource,
  resolveSizeSourceId,
  sizeSourcesFromTypes,
  sortSizesForSource,
  type TrSizeSource,
} from "./sizeSources";
import {
  emptyStockInputs,
  missingSourceSizes,
  sizesFromStockInputs,
  sizesInStockInputs,
  stockInputsForProductSizes,
  switchStockInputs,
} from "./sizeStockInputs";

const letter = findSizeSource(BUILT_IN_SIZE_SOURCES, "letter")!;
const numeric = findSizeSource(BUILT_IN_SIZE_SOURCES, "numeric")!;

function sizeType(id: string, name: string, labels: string[], role: "size" | null = "size") {
  return {
    id,
    name,
    role,
    values: labels.map((label, index) => ({
      id: `${id}-${index}`,
      label,
      hex: null,
      imageUrl: null,
      sortOrder: index,
    })),
  };
}

const lilaTypes = [
  sizeType("beden", "Beden", ["XS", "S", "M", "L", "XL", "2XL", "3XL"]),
  sizeType("pantolon", "Pantolon bedeni", [
    "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44", "46", "48", "50", "52",
  ]),
  sizeType("renk", "Renk", ["Siyah"], null),
];

describe("size sources", () => {
  it("are the boutique's Beden types, or the built-in lists when it has none", () => {
    const sources = sizeSourcesFromTypes(lilaTypes);
    assert.deepEqual(sources.map((source) => source.id), ["beden", "pantolon"]);
    assert.equal(sources[0]!.hint, "XS–3XL");
    assert.deepEqual(
      sizeSourcesFromTypes([lilaTypes[2]!]).map((source) => source.id),
      ["letter", "numeric"],
    );
  });

  it("find the source a product's sizes belong to", () => {
    const sources = sizeSourcesFromTypes(lilaTypes);
    assert.equal(detectSizeSourceId(sources, ["S", "M"]), "beden");
    assert.equal(detectSizeSourceId(sources, ["28", "30", "44"]), "pantolon");
    assert.equal(detectSizeSourceId(sources, []), "none");
    assert.equal(detectSizeSourceId(BUILT_IN_SIZE_SOURCES, ["42", "44"]), "numeric");
  });

  it("move an old draft's built-in list onto the matching type", () => {
    const sources = sizeSourcesFromTypes(lilaTypes);
    assert.equal(resolveSizeSourceId(sources, "letter"), "beden");
    assert.equal(resolveSizeSourceId(sources, "numeric"), "pantolon");
    assert.equal(resolveSizeSourceId(sources, "none"), "none");
    assert.equal(resolveSizeSourceId(sources, "pantolon"), "pantolon");
    assert.equal(resolveSizeSourceId(sources, "deleted-type"), "beden");
    assert.equal(resolveSizeSourceId(BUILT_IN_SIZE_SOURCES, "letter"), "letter");
  });

  it("sort sizes in the source's order, unknown labels last", () => {
    const custom: TrSizeSource = { ...letter, values: ["L", "M", "S"] };
    assert.deepEqual(sortSizesForSource(custom, ["S", "STD", "L", "M"]), ["L", "M", "S", "STD"]);
    assert.deepEqual(sortSizesForSource(null, ["M", "XS"]), ["XS", "M"]);
  });
});

describe("size stock inputs", () => {
  const xsToXl = stockInputsForProductSizes(["XS", "S", "M", "L", "XL"], {
    XS: 1,
    S: 0,
    M: 2,
    L: 0,
    XL: 4,
  });

  it("keep exactly the product's sizes", () => {
    assert.deepEqual(xsToXl, { XS: "1", S: "0", M: "2", L: "0", XL: "4" });
    assert.deepEqual(sizesInStockInputs({ L: "1", XS: "0", M: "2" }, letter), ["XS", "M", "L"]);
  });

  it("offer the source's missing sizes", () => {
    assert.deepEqual(missingSourceSizes(letter, xsToXl), ["2XL", "3XL"]);
    assert.deepEqual(missingSourceSizes(null, xsToXl), []);
  });

  it("start a new product with the whole source (create flows)", () => {
    assert.deepEqual(Object.keys(emptyStockInputs(letter)), [
      "XS", "S", "M", "L", "XL", "2XL", "3XL",
    ]);
    assert.deepEqual(sizesFromStockInputs(letter, xsToXl), [
      "XS", "S", "M", "L", "XL", "2XL", "3XL",
    ]);
    assert.deepEqual(sizesFromStockInputs(numeric, { "24": "1", "44": "2" }).slice(-1), ["44"]);
    assert.deepEqual(sizesFromStockInputs(null, xsToXl), []);
  });

  it("keep typed stock and custom sizes when switching source", () => {
    const next = switchStockInputs(letter, numeric, { S: "3", STD: "2" });
    assert.equal(next.S, undefined);
    assert.equal(next.STD, "2");
    assert.equal(next["24"], "0");
    assert.deepEqual(switchStockInputs(letter, null, { S: "3" }), {});
  });

  it("read a missing size stock as 0", () => {
    assert.deepEqual(stockInputsForProductSizes(["S", " ", "M"], { S: 3 }), { S: "3", M: "0" });
  });
});
