import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DETAIL_COLUMNS,
  detailRow,
  hasDetailValue,
  isEmptyDetail,
  withoutDetailColumns,
} from "@/lib/tr/catalog/productDetailColumns";
import { mapProductDetails, mapProductRow } from "@/lib/tr/catalog/mappers";

describe("detailRow", () => {
  it("only carries what was given", () => {
    assert.deepEqual(detailRow({}), {});
    assert.deepEqual(detailRow({ brand: "Lila", tags: [] }), { brand: "Lila", tags: [] });
  });

  it("spreads the unit price over its three columns", () => {
    assert.deepEqual(
      detailRow({ unitPrice: { enabled: true, amount: 500, type: "g" } }),
      { unit_price_enabled: true, unit_amount: 500, unit_type: "g" },
    );
    assert.deepEqual(detailRow({ unitPrice: undefined }), {});
  });

  it("only ever names columns the SQL patch adds", () => {
    const row = detailRow({
      descriptionHtml: "<p>x</p>",
      brand: "b",
      tags: ["t"],
      googleCategory: "g",
      sku: "s",
      barcode: "1",
      desi: 1,
      continueSelling: true,
      unitPrice: { enabled: false, amount: null, type: null },
    });
    for (const column of Object.keys(row)) {
      assert.ok(DETAIL_COLUMNS.has(column), column);
    }
  });
});

describe("empty details", () => {
  it("treats column defaults as empty", () => {
    assert.equal(isEmptyDetail(null), true);
    assert.equal(isEmptyDetail(false), true);
    assert.equal(isEmptyDetail([]), true);
    assert.equal(isEmptyDetail(""), false);
    assert.equal(isEmptyDetail(0), false);
    assert.equal(isEmptyDetail(["a"]), false);
    assert.equal(isEmptyDetail(true), false);
  });

  it("spots a real value among defaults, and ignores non-detail columns", () => {
    assert.equal(hasDetailValue({ title: "x", brand: null, tags: [] }), false);
    assert.equal(hasDetailValue({ title: "x", brand: "Lila" }), true);
    assert.equal(hasDetailValue({ description_html: null, desi: 2 }), true);
  });

  it("drops the detail columns and keeps the rest", () => {
    assert.deepEqual(
      withoutDetailColumns({ title: "x", price_kurus: 5, brand: null, tags: [] }),
      { title: "x", price_kurus: 5 },
    );
  });
});

describe("mapProductDetails", () => {
  it("maps nothing when the columns are absent (old database, storefront lists)", () => {
    assert.deepEqual(mapProductDetails({ id: "p", title: "t" }), {});
  });

  it("maps the columns present in the row", () => {
    assert.deepEqual(
      mapProductDetails({
        description_html: "<p>x</p>",
        brand: "Lila",
        tags: ["a", 5, "b"],
        google_category: null,
        sku: "S1",
        barcode: "",
        desi: "2.50",
        continue_selling_when_out_of_stock: true,
        unit_price_enabled: true,
        unit_amount: "500",
        unit_type: "g",
      }),
      {
        descriptionHtml: "<p>x</p>",
        brand: "Lila",
        tags: ["a", "b"],
        googleCategory: null,
        sku: "S1",
        barcode: null,
        desi: 2.5,
        continueSelling: true,
        unitPrice: { enabled: true, amount: 500, type: "g" },
      },
    );
  });

  it("ignores an unknown unit type", () => {
    assert.deepEqual(
      mapProductDetails({ unit_price_enabled: false, unit_amount: null, unit_type: "yıl" }).unitPrice,
      { enabled: false, amount: null, type: null },
    );
  });

  it("leaves a mapped product without detail keys when the row has none", () => {
    const product = mapProductRow({
      id: "p",
      boutique_id: "b",
      title: "t",
      price_kurus: 100,
      status: "available",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    });
    for (const key of ["brand", "tags", "sku", "desi", "unitPrice", "descriptionHtml"]) {
      assert.equal(key in product, false, key);
    }
  });
});
