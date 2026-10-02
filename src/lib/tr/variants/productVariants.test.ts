import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  combinationKey,
  generateCombinations,
  planVariantChanges,
  PRODUCT_VARIANT_LIMITS,
  readVariantsBody,
  sumActiveStock,
  variantLabel,
} from "@/lib/tr/variants/productVariantRules";
import {
  applyBulk,
  applySelection,
  EMPTY_VARIANTS_FORM,
  hasBulkChanges,
  selectionFromForm,
  selectionProblem,
  validateVariantsForm,
  variantsBody,
  variantsFormFromProduct,
  variantsTotalStock,
} from "@/lib/tr/variants/variantForm";
import { mapProductVariantRow, type TrVariantType } from "@/lib/tr/variants/types";

const value = (id: string, label: string, sortOrder: number) => ({
  id,
  label,
  hex: null,
  imageUrl: null,
  sortOrder,
});
const renk = {
  id: "renk",
  values: [value("k", "Kırmızı", 0), value("m", "Mavi", 1), value("y", "Yeşil", 2)],
};
const beden = {
  id: "beden",
  values: [value("s", "S", 0), value("l", "L", 1)],
};
const types = [renk, beden] as unknown as TrVariantType[];

describe("generateCombinations", () => {
  it("is the product of the values, in option order then value order", () => {
    assert.deepEqual(
      generateCombinations([
        ["k", "m"],
        ["s", "l"],
      ]),
      [
        ["k", "s"],
        ["k", "l"],
        ["m", "s"],
        ["m", "l"],
      ],
    );
    assert.deepEqual(generateCombinations([["k", "m"]]), [["k"], ["m"]]);
  });

  it("is empty without options or when an option has no values", () => {
    assert.deepEqual(generateCombinations([]), []);
    assert.deepEqual(generateCombinations([["k"], []]), []);
  });
});

describe("labels and stock", () => {
  it("joins value labels with a slash", () => {
    const labels: Record<string, string> = { k: "Kırmızı", s: "S" };
    assert.equal(variantLabel(["k", "s"], (id) => labels[id]!), "Kırmızı / S");
  });

  it("sums the stock of active variants only", () => {
    assert.equal(
      sumActiveStock([
        { stock: 3, active: true },
        { stock: 5, active: false },
        { stock: 2, active: true },
      ]),
      5,
    );
  });
});

describe("planVariantChanges", () => {
  const stored = [
    { id: "1", optionValueIds: ["k", "s"] },
    { id: "2", optionValueIds: ["k", "l"] },
    { id: "3", optionValueIds: ["m", "s"] },
  ];

  it("matches by combination: same is an update, new is an insert, missing is removed", () => {
    const plan = planVariantChanges(stored, [
      { optionValueIds: ["k", "l"], sku: "a" },
      { optionValueIds: ["y", "s"], sku: "b" },
      { optionValueIds: ["k", "s"], sku: "c" },
    ]);
    assert.deepEqual(
      plan.update.map((entry) => [entry.existing.id, entry.submitted.sku]),
      [
        ["2", "a"],
        ["1", "c"],
      ],
    );
    assert.deepEqual(plan.insert.map((row) => row.sku), ["b"]);
    assert.deepEqual(plan.remove.map((row) => row.id), ["3"]);
  });

  it("removes everything when nothing is submitted", () => {
    assert.equal(planVariantChanges(stored, []).remove.length, 3);
  });
});

describe("readVariantsBody", () => {
  const row = (extra: Record<string, unknown> = {}) => ({
    optionValueIds: ["k", "s"],
    stock: 4,
    ...extra,
  });

  it("leaves variants alone when not sent and clears them for null or no rows", () => {
    assert.equal(readVariantsBody(undefined), undefined);
    assert.deepEqual(readVariantsBody(null), { typeIds: [], variants: [] });
    assert.deepEqual(readVariantsBody({ typeIds: ["renk"], rows: [] }), { typeIds: [], variants: [] });
    assert.deepEqual(readVariantsBody({ typeIds: [], rows: [row()] }), { typeIds: [], variants: [] });
  });

  it("reads rows, turning TRY prices into kuruş and blanks into null", () => {
    const input = readVariantsBody({
      typeIds: ["renk", "beden"],
      rows: [
        row({ sku: " A-1 ", barcode: "869", priceTry: 399.9, images: ["u1", "u1", "u2"], active: false }),
        row({ optionValueIds: ["k", "l"], sku: "", priceTry: "" }),
      ],
    });
    assert.deepEqual(input, {
      typeIds: ["renk", "beden"],
      variants: [
        { optionValueIds: ["k", "s"], sku: "A-1", barcode: "869", priceKurus: 39990, stock: 4, images: ["u1", "u2"], active: false },
        { optionValueIds: ["k", "l"], sku: null, barcode: null, priceKurus: null, stock: 4, images: [], active: true },
      ],
    });
  });

  it("rejects malformed input with a sentence", () => {
    const rows = (list: unknown[]) => ({ typeIds: ["renk", "beden"], rows: list });
    assert.throws(() => readVariantsBody("x"), /geçersiz/);
    assert.throws(() => readVariantsBody({ typeIds: "renk", rows: [] }), /geçersiz/);
    assert.throws(() => readVariantsBody({ typeIds: ["a", "a"], rows: [] }), /iki kez/);
    assert.throws(
      () => readVariantsBody({ typeIds: ["a", "b", "c", "d"], rows: [] }),
      /En fazla 3/,
    );
    assert.throws(() => readVariantsBody(rows([row({ optionValueIds: ["k"] })])), /eksik/);
    assert.throws(() => readVariantsBody(rows([row(), row()])), /iki kez/);
    assert.throws(() => readVariantsBody(rows([row({ stock: -1 })])), /stoğu/);
    assert.throws(() => readVariantsBody(rows([row({ stock: 1.5 })])), /stoğu/);
    assert.throws(() => readVariantsBody(rows([row({ priceTry: 0 })])), /fiyatı/);
    assert.throws(() => readVariantsBody(rows([row({ priceTry: "abc" })])), /fiyatı/);
    assert.throws(() => readVariantsBody(rows([row({ barcode: "1 2" })])), /Barkod/);
    const many = Array.from({ length: PRODUCT_VARIANT_LIMITS.variantsMax + 1 }, (_, i) =>
      row({ optionValueIds: [`a${i}`, "s"] }),
    );
    assert.throws(() => readVariantsBody(rows(many)), /En fazla 100/);
  });
});

describe("the variants form", () => {
  const loaded = variantsFormFromProduct({
    typeIds: ["renk", "beden"],
    variants: [
      { id: "v2", optionValueIds: ["k", "l"], sku: null, barcode: null, priceKurus: 45000, stock: 2, images: [], active: true, sortOrder: 1 },
      { id: "v1", optionValueIds: ["k", "s"], sku: "K-S", barcode: null, priceKurus: null, stock: 5, images: ["u"], active: false, sortOrder: 0 },
    ],
  });

  it("loads rows in order with prices as typed text", () => {
    assert.deepEqual(
      loaded.rows.map((row) => [row.key, row.sku, row.price, row.stock, row.active]),
      [
        ["k|s", "K-S", "", "5", false],
        ["k|l", "", "450", "2", true],
      ],
    );
    assert.equal(variantsTotalStock(loaded), 2); // the inactive row does not count
  });

  it("round-trips through the API body", () => {
    const input = readVariantsBody(variantsBody(loaded))!;
    assert.deepEqual(input.variants.map((v) => [v.optionValueIds.join("|"), v.priceKurus, v.stock]), [
      ["k|s", null, 5],
      ["k|l", 45000, 2],
    ]);
    assert.equal(validateVariantsForm(loaded), null);
    assert.match(
      validateVariantsForm({ ...loaded, rows: [{ ...loaded.rows[0]!, stock: "-3" }] })!,
      /stoğu/,
    );
  });

  it("reads the selection back from the rows, in the type's value order", () => {
    assert.deepEqual(selectionFromForm(loaded, types), {
      typeIds: ["renk", "beden"],
      valueIdsByType: { renk: ["k"], beden: ["s", "l"] },
    });
  });

  it("keeps the data of a combination that survives and adds new ones blank", () => {
    const selection = {
      typeIds: ["renk", "beden"],
      valueIdsByType: { renk: ["m", "k"], beden: ["s", "l"] },
    };
    const { form, removed } = applySelection(loaded, selection, types);
    assert.equal(removed, 0);
    assert.deepEqual(form.rows.map((row) => row.key), ["k|s", "k|l", "m|s", "m|l"]);
    assert.equal(form.rows[0]!.sku, "K-S"); // kept
    assert.equal(form.rows[1]!.price, "450"); // kept
    assert.deepEqual(
      [form.rows[2]!.sku, form.rows[2]!.stock, form.rows[2]!.active],
      ["", "0", true],
    ); // new, blank
  });

  it("counts the rows a smaller selection drops", () => {
    const { form, removed } = applySelection(
      loaded,
      { typeIds: ["renk", "beden"], valueIdsByType: { renk: ["k"], beden: ["s"] } },
      types,
    );
    assert.deepEqual(form.rows.map((row) => row.key), ["k|s"]);
    assert.equal(removed, 1);
  });

  it("carries nothing over when the option types change", () => {
    const { form, removed } = applySelection(
      loaded,
      { typeIds: ["beden", "renk"], valueIdsByType: { renk: ["k"], beden: ["s", "l"] } },
      types,
    );
    assert.deepEqual(form.rows.map((row) => row.key), ["s|k", "l|k"]);
    assert.equal(form.rows.every((row) => row.sku === ""), true);
    assert.equal(removed, 2);
  });

  it("clears everything when no type is selected", () => {
    const { form, removed } = applySelection(
      loaded,
      { typeIds: [], valueIdsByType: {} },
      types,
    );
    assert.deepEqual(form, EMPTY_VARIANTS_FORM);
    assert.equal(removed, 2);
  });

  it("allows one photo option per product", () => {
    const photo = (id: string, name: string) =>
      ({ id, name, hasPhotos: true, values: [value(`${id}1`, "A", 0)] }) as unknown as TrVariantType;
    const withPhotos = [photo("renk2", "Renk"), photo("desen", "Desen"), beden as unknown as TrVariantType];
    assert.match(
      selectionProblem(
        { typeIds: ["renk2", "desen"], valueIdsByType: { renk2: ["renk21"], desen: ["desen1"] } },
        withPhotos,
      )!,
      /yalnızca bir fotoğraflı seçenek olabilir \(Renk, Desen\)/,
    );
    assert.equal(
      selectionProblem({ typeIds: ["renk2", "beden"], valueIdsByType: { renk2: ["renk21"], beden: ["s"] } }, withPhotos),
      null,
    );
  });

  it("explains a selection that can't be applied", () => {
    assert.equal(selectionProblem({ typeIds: [], valueIdsByType: {} }, types), null);
    assert.match(
      selectionProblem({ typeIds: ["renk"], valueIdsByType: { renk: [] } }, types)!,
      /en az bir değer/,
    );
    assert.equal(
      selectionProblem({ typeIds: ["renk", "beden"], valueIdsByType: { renk: ["k", "m", "y"], beden: ["s", "l"] } }, types),
      null,
    );
    const big = {
      id: "big",
      values: Array.from({ length: 11 }, (_, i) => value(`b${i}`, `B${i}`, i)),
    } as unknown as TrVariantType;
    const wide = {
      id: "wide",
      values: Array.from({ length: 10 }, (_, i) => value(`w${i}`, `W${i}`, i)),
    } as unknown as TrVariantType;
    assert.match(
      selectionProblem(
        {
          typeIds: ["big", "wide"],
          valueIdsByType: {
            big: big.values.map((v) => v.id),
            wide: wide.values.map((v) => v.id),
          },
        },
        [big, wide],
      )!,
      /110 varyant/,
    );
  });

  it("bulk-edits every row or the rows of one value, leaving unset fields alone", () => {
    const all = applyBulk(loaded, { kind: "all" }, { price: "500", active: true });
    assert.deepEqual(all.rows.map((row) => [row.price, row.stock, row.active]), [
      ["500", "5", true],
      ["500", "2", true],
    ]);
    const one = applyBulk(loaded, { kind: "value", valueId: "l" }, { stock: "9" });
    assert.deepEqual(one.rows.map((row) => row.stock), ["5", "9"]);
    const untouched = applyBulk(loaded, { kind: "all" }, { price: "  ", stock: "" });
    assert.deepEqual(untouched, loaded);
    assert.equal(hasBulkChanges({}), false);
    assert.equal(hasBulkChanges({ stock: "1" }), true);
    assert.equal(hasBulkChanges({ active: false }), true);
  });
});

describe("mapProductVariantRow", () => {
  it("maps a stored row, tolerating gaps", () => {
    assert.deepEqual(
      mapProductVariantRow({
        id: "v",
        option_value_ids: ["a", 5, "b"],
        sku: "",
        price_kurus: 1000,
        stock: 3,
        images: ["u", null],
        active: false,
        sort_order: 2,
      }),
      {
        id: "v",
        optionValueIds: ["a", "b"],
        sku: null,
        barcode: null,
        priceKurus: 1000,
        stock: 3,
        images: ["u"],
        active: false,
        sortOrder: 2,
      },
    );
  });
});

describe("combinationKey", () => {
  it("joins ids", () => {
    assert.equal(combinationKey(["a", "b"]), "a|b");
  });
});
