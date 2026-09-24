import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeTags,
  parseDecimalInput,
  PRODUCT_DETAIL_LIMITS,
  readProductDetailsBody,
  sanitizeDecimalInput,
} from "@/lib/tr/productDetails";
import { unitPricePerReference } from "@/lib/tr/productUnits";

describe("normalizeTags", () => {
  it("trims, collapses spaces, drops blanks and repeats (Turkish case rules)", () => {
    assert.deepEqual(
      normalizeTags(["  yaz   koleksiyonu ", "", "YAZ KOLEKSİYONU", "Yaz koleksiyonu", "ışık", "IŞIK"]),
      ["yaz koleksiyonu", "ışık"],
    );
  });
});

describe("decimal inputs", () => {
  it("keeps one separator and limits the digits", () => {
    assert.equal(sanitizeDecimalInput("12,555", 2, 4), "12,55");
    assert.equal(sanitizeDecimalInput("1a2.5.5", 2, 4), "12.55");
    assert.equal(sanitizeDecimalInput("123456", 2, 4), "1234");
  });

  it("parses both separators and rejects text", () => {
    assert.equal(parseDecimalInput("2,5"), 2.5);
    assert.equal(parseDecimalInput("2.5"), 2.5);
    assert.equal(parseDecimalInput(""), null);
    assert.equal(parseDecimalInput("abc"), null);
  });
});

describe("readProductDetailsBody", () => {
  it("leaves alone what was not sent", () => {
    assert.deepEqual(readProductDetailsBody({ title: "x" }), {});
  });

  it("reads every field and normalizes it", () => {
    const details = readProductDetailsBody({
      descriptionHtml: "<p>Merhaba</p>",
      brand: "  Lila   Atölye ",
      tags: ["yeni", "Yeni", " indirim "],
      googleCategory: "Giyim ve Aksesuar > Giyim",
      sku: " LB-001 ",
      barcode: "8690000000012",
      desi: 1.257,
      continueSelling: true,
      unitPrice: { enabled: true, amount: 500, type: "g" },
      supplier: "Toptancı A.Ş.",
      hsCode: "6109.10.00.00.00",
    });
    assert.deepEqual(details, {
      descriptionHtml: "<p>Merhaba</p>",
      brand: "Lila Atölye",
      tags: ["yeni", "indirim"],
      googleCategory: "Giyim ve Aksesuar > Giyim",
      sku: "LB-001",
      barcode: "8690000000012",
      desi: 1.26,
      continueSelling: true,
      unitPrice: { enabled: true, amount: 500, type: "g" },
      supplier: "Toptancı A.Ş.",
      hsCode: "6109.10.00.00.00",
    });
  });

  it("turns blank text into null so a field can be cleared", () => {
    const details = readProductDetailsBody({
      brand: "  ",
      sku: "",
      desi: "",
      supplier: null,
      hsCode: "",
      descriptionHtml: null,
    });
    assert.deepEqual(details, {
      brand: null,
      sku: null,
      desi: null,
      supplier: null,
      hsCode: null,
      descriptionHtml: null,
    });
  });

  it("rejects values that are too long or malformed", () => {
    const tooMany = Array.from({ length: PRODUCT_DETAIL_LIMITS.tagsMax + 1 }, (_, i) => `t${i}`);
    assert.throws(() => readProductDetailsBody({ tags: tooMany }), /etiket/);
    assert.throws(
      () => readProductDetailsBody({ tags: ["x".repeat(PRODUCT_DETAIL_LIMITS.tagMax + 1)] }),
      /etiket/i,
    );
    assert.throws(() => readProductDetailsBody({ brand: "x".repeat(121) }), /Marka/);
    assert.throws(() => readProductDetailsBody({ sku: "a\u0000b" }), /SKU/);
    assert.throws(() => readProductDetailsBody({ barcode: "12 34" }), /Barkod/);
    assert.throws(() => readProductDetailsBody({ hsCode: "12ab" }), /HS kodu/);
    assert.throws(() => readProductDetailsBody({ hsCode: "12" }), /HS kodu/);
    assert.throws(() => readProductDetailsBody({ desi: 0 }), /Desi/);
    assert.throws(() => readProductDetailsBody({ desi: 10_000 }), /Desi/);
    assert.throws(() => readProductDetailsBody({ desi: "abc" }), /Desi/);
    assert.throws(() => readProductDetailsBody({ brand: 5 }), /Marka/);
    assert.throws(() => readProductDetailsBody({ descriptionHtml: 5 }), /Açıklama/);
    assert.throws(
      () => readProductDetailsBody({ descriptionHtml: "x".repeat(60_001) }),
      /uzun/,
    );
  });

  it("needs an amount and unit when the unit price is on", () => {
    assert.throws(
      () => readProductDetailsBody({ unitPrice: { enabled: true, amount: null, type: "kg" } }),
      /miktar ve birim/,
    );
    assert.throws(
      () => readProductDetailsBody({ unitPrice: { enabled: true, amount: 5, type: null } }),
      /miktar ve birim/,
    );
    assert.throws(
      () => readProductDetailsBody({ unitPrice: { enabled: false, amount: 5, type: "yıl" } }),
      /Birim türü/,
    );
    assert.deepEqual(
      readProductDetailsBody({ unitPrice: { enabled: false, amount: null, type: null } }),
      { unitPrice: { enabled: false, amount: null, type: null } },
    );
  });
});

describe("unitPricePerReference", () => {
  it("quotes the price per kg, l or m", () => {
    // 250 TL for 500 g is 500 TL per kg.
    assert.deepEqual(
      unitPricePerReference(25_000, { enabled: true, amount: 500, type: "g" }),
      { perKurus: 50_000, symbol: "kg" },
    );
    assert.deepEqual(
      unitPricePerReference(9_000, { enabled: true, amount: 1.5, type: "l" }),
      { perKurus: 6_000, symbol: "l" },
    );
    assert.deepEqual(
      unitPricePerReference(3_000, { enabled: true, amount: 50, type: "cm" }),
      { perKurus: 6_000, symbol: "m" },
    );
    assert.deepEqual(
      unitPricePerReference(1_000, { enabled: true, amount: 4, type: "adet" }),
      { perKurus: 250, symbol: "adet" },
    );
  });

  it("is null when off or incomplete", () => {
    assert.equal(unitPricePerReference(1_000, null), null);
    assert.equal(unitPricePerReference(1_000, { enabled: false, amount: 5, type: "kg" }), null);
    assert.equal(unitPricePerReference(1_000, { enabled: true, amount: null, type: "kg" }), null);
    assert.equal(unitPricePerReference(1_000, { enabled: true, amount: 5, type: null }), null);
  });
});
