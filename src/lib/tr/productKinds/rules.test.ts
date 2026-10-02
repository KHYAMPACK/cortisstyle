import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  attributeKeyFromLabel,
  isValidAttributeKey,
  narrowOptions,
  planKindAssignments,
  planKindImport,
  readAttributeBody,
  readKindBody,
  resolveKindInput,
} from "./rules";
import type { TrKindTemplate } from "./types";

describe("attributeKeyFromLabel", () => {
  it("makes a camelCase ASCII key from a Turkish label", () => {
    assert.equal(attributeKeyFromLabel("Ana malzeme", []), "anaMalzeme");
    assert.equal(attributeKeyFromLabel("Üretim yeri", []), "uretimYeri");
    assert.equal(attributeKeyFromLabel("Kumaş Ağırlığı (gr)", []), "kumasAgirligiGr");
  });

  it("stays unique and never takes a reserved key", () => {
    assert.equal(attributeKeyFromLabel("Kumaş", ["kumas"]), "kumas2");
    assert.equal(attributeKeyFromLabel("Kumaş", ["kumas", "kumas2"]), "kumas3");
    assert.equal(attributeKeyFromLabel("Hem", []), "hem2");
  });

  it("starts with a letter even for a label of digits or symbols", () => {
    assert.equal(attributeKeyFromLabel("100% pamuk", []), "alan100Pamuk");
    assert.equal(attributeKeyFromLabel("!!!", []), "alan");
    assert.ok(isValidAttributeKey(attributeKeyFromLabel("2. kat", [])));
  });
});

describe("readAttributeBody", () => {
  it("keeps options only for a choice field", () => {
    assert.deepEqual(
      readAttributeBody({ label: " Kumaş ", input: "text", options: ["Keten"], allowCustom: true }),
      { label: "Kumaş", input: "text", options: [], allowCustom: false },
    );
    assert.deepEqual(
      readAttributeBody({ label: "Kumaş", input: "choice", options: [" Keten", "", "Pamuk"] }),
      { label: "Kumaş", input: "choice", options: ["Keten", "Pamuk"], allowCustom: false },
    );
  });

  it("explains what is wrong", () => {
    assert.throws(() => readAttributeBody({ label: "", input: "text" }), /adı zorunlu/);
    assert.throws(() => readAttributeBody({ label: "Kumaş", input: "x" }), /Giriş türünü/);
    assert.throws(
      () => readAttributeBody({ label: "Kumaş", input: "choice", options: [] }),
      /en az bir seçenek/,
    );
    assert.throws(
      () => readAttributeBody({ label: "Kumaş", input: "choice", options: ["Keten", "keten"] }),
      /iki kez/,
    );
  });
});

describe("readKindBody / resolveKindInput", () => {
  const attributes = [
    { id: "a-boy", input: "choice" as const, options: ["Mini", "Midi", "Maxi"] },
    { id: "a-renk", input: "text" as const, options: [] },
  ];
  const context = {
    attributes,
    variantTypeIds: new Set(["t-beden"]),
    categoryIds: new Set(["c-elbise"]),
  };

  it("reads a kind and narrows option subsets to the field's options", () => {
    const input = readKindBody({
      name: " Elbise ",
      defaultOptionTypeIds: ["t-beden", "t-beden"],
      suggestedCategoryId: "c-elbise",
      attributes: [
        { attributeId: "a-boy", options: ["maxi", "Mini", "Yok"] },
        { attributeId: "a-renk", required: true, options: ["x"] },
        { attributeId: "a-boy" },
      ],
    });
    assert.equal(input.name, "Elbise");
    assert.deepEqual(input.defaultOptionTypeIds, ["t-beden"]);
    const resolved = resolveKindInput(input, context);
    assert.deepEqual(resolved.attributes, [
      { attributeId: "a-boy", required: false, options: ["Mini", "Maxi"] },
      { attributeId: "a-renk", required: true, options: null },
    ]);
  });

  it("rejects references the boutique doesn't have", () => {
    const base = { name: "Elbise", defaultOptionTypeIds: [], suggestedCategoryId: null, attributes: [] };
    assert.throws(
      () => resolveKindInput({ ...base, defaultOptionTypeIds: ["t-x"] }, context),
      /Varyant türü bulunamadı/,
    );
    assert.throws(
      () => resolveKindInput({ ...base, suggestedCategoryId: "c-x" }, context),
      /Kategori bulunamadı/,
    );
    assert.throws(
      () =>
        resolveKindInput(
          { ...base, attributes: [{ attributeId: "a-x", required: false, options: null }] },
          context,
        ),
      /Özellik bulunamadı/,
    );
  });

  it("treats a subset covering every option as all of them", () => {
    assert.equal(narrowOptions(attributes[0]!, ["Maxi", "Midi", "Mini"]), null);
    assert.deepEqual(narrowOptions(attributes[0]!, []), []);
  });
});

describe("planKindImport", () => {
  const template: TrKindTemplate = {
    attributes: [
      { key: "fabric", label: "Kumaş", input: "choice", options: ["Keten"], allowCustom: true },
      { key: "color", label: "Renk", input: "text", options: [], allowCustom: false },
    ],
    kinds: [
      {
        systemKey: "elbise",
        name: "Elbise",
        optionTypeNames: ["Beden", "Renk"],
        suggestedCategoryKey: "elbise",
        attributes: [{ key: "fabric" }, { key: "color" }, { key: "missing" }],
      },
      { systemKey: "takim", name: "Takım", attributes: [{ key: "color" }] },
    ],
  };

  it("creates what the boutique lacks and resolves its own rows", () => {
    const plan = planKindImport(template, {
      attributes: [{ key: "color", label: "Renk" }],
      kinds: [{ name: "takım", systemKey: null }],
      variantTypes: [{ id: "t-beden", name: "beden" }],
      categories: [{ id: "c-elbise", systemKey: "elbise" }],
    });
    assert.deepEqual(
      plan.attributes.map((attribute) => attribute.key),
      ["fabric"],
    );
    assert.deepEqual(plan.kinds, [
      {
        systemKey: "elbise",
        name: "Elbise",
        defaultOptionTypeIds: ["t-beden"],
        suggestedCategoryId: "c-elbise",
        attributes: [
          { key: "fabric", required: false, options: null },
          { key: "color", required: false, options: null },
        ],
      },
    ]);
  });

  it("skips a field whose label is taken under another key", () => {
    const plan = planKindImport(template, {
      attributes: [{ key: "kumas", label: "kumaş" }],
      kinds: [],
      variantTypes: [],
      categories: [],
    });
    assert.deepEqual(plan.attributes.map((attribute) => attribute.key), ["color"]);
    assert.deepEqual(plan.kinds[0]!.attributes.map((link) => link.key), ["color"]);
  });
});

describe("planKindAssignments", () => {
  it("assigns only products without a kind whose category maps to a kind", () => {
    const plan = planKindAssignments(
      [
        { id: "p1", category: "elbise", kindId: null },
        { id: "p2", category: "bluz", kindId: null },
        { id: "p3", category: "elbise", kindId: "k-other" },
        { id: "p4", category: "unknown", kindId: null },
        { id: "p5", category: null, kindId: null },
      ],
      (slug) => (slug === "elbise" ? "elbise" : slug === "bluz" ? "ust-giyim" : null),
      [
        { id: "k-elbise", systemKey: "elbise" },
        { id: "k-ust", systemKey: "ust-giyim" },
        { id: "k-own", systemKey: null },
      ],
    );
    assert.deepEqual([...plan], [
      ["k-elbise", ["p1"]],
      ["k-ust", ["p2"]],
    ]);
  });
});
