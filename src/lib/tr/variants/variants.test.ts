import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addValues,
  emptyVariantTypeForm,
  formFromVariantType,
  moveValue,
  splitValueInput,
  validateVariantTypeForm,
  variantTypeBody,
} from "@/lib/tr/variants/typeForm";
import {
  hasTypeNamed,
  normalizeHex,
  builtInSizeTypeInputs,
  importableSizeTypeInputs,
  planValueChanges,
  readVariantTypeBody,
  VARIANT_TYPE_LIMITS,
} from "@/lib/tr/variants/typeRules";
import { mapVariantTypeRow, mapVariantValueRow } from "@/lib/tr/variants/types";

describe("normalizeHex", () => {
  it("accepts #rrggbb in any case and rejects everything else", () => {
    assert.equal(normalizeHex("#C8102E"), "#c8102e");
    assert.equal(normalizeHex(" #aabbcc "), "#aabbcc");
    assert.equal(normalizeHex("#abc"), null);
    assert.equal(normalizeHex("red"), null);
    assert.equal(normalizeHex(null), null);
  });
});

describe("readVariantTypeBody", () => {
  const list = (values: unknown[], extra: Record<string, unknown> = {}) => ({
    name: "Beden",
    selectionStyle: "list",
    values,
    ...extra,
  });

  it("reads a list type, cleaning names and skipping empty rows", () => {
    const input = readVariantTypeBody(
      list([{ label: " S " }, { label: "" }, { label: "M", hex: "#ffffff", imageUrl: "x" }], {
        name: "  Beden   ",
      }),
    );
    assert.deepEqual(input, {
      name: "Beden",
      selectionStyle: "list",
      role: null,
      // a list type keeps no colours or pictures
      values: [
        { label: "S", hex: null, imageUrl: null },
        { label: "M", hex: null, imageUrl: null },
      ],
    });
  });

  it("keeps ids and, for swatches, the colour or picture", () => {
    const input = readVariantTypeBody({
      name: "Renk",
      selectionStyle: "swatch",
      values: [
        { id: "v1", label: "Kırmızı", hex: "#FF0000" },
        { label: "Desenli", imageUrl: "https://cdn/x.png" },
      ],
    });
    assert.deepEqual(input.values, [
      { id: "v1", label: "Kırmızı", hex: "#ff0000", imageUrl: null },
      { label: "Desenli", hex: null, imageUrl: "https://cdn/x.png" },
    ]);
  });

  it("asks for a colour or picture on every swatch value", () => {
    assert.throws(
      () =>
        readVariantTypeBody({
          name: "Renk",
          selectionStyle: "swatch",
          values: [{ label: "Mavi", hex: "mavi" }],
        }),
      /Mavi.*renk veya görsel/,
    );
  });

  it("rejects the usual mistakes with a sentence", () => {
    assert.throws(() => readVariantTypeBody(list([{ label: "S" }], { name: " " })), /adı zorunlu/);
    assert.throws(
      () => readVariantTypeBody(list([{ label: "S" }], { name: "x".repeat(41) })),
      /en fazla 40/,
    );
    assert.throws(() => readVariantTypeBody(list([{ label: "S" }], { selectionStyle: "x" })), /stil/);
    assert.throws(() => readVariantTypeBody(list([])), /En az bir değer/);
    assert.throws(() => readVariantTypeBody(list([{ label: " " }])), /En az bir değer/);
    assert.throws(() => readVariantTypeBody(list([{ label: "S" }, { label: "s" }])), /iki kez/);
    assert.throws(
      () => readVariantTypeBody(list([{ label: "I" }, { label: "ı" }, { label: "İ" }, { label: "i" }])),
      /iki kez/,
    );
    assert.throws(() => readVariantTypeBody(list([{ label: "x".repeat(41) }])), /en fazla 40/);
    assert.throws(() => readVariantTypeBody({ name: "a", selectionStyle: "list", values: "S" }), /geçersiz/);
    const tooMany = Array.from({ length: VARIANT_TYPE_LIMITS.valuesMax + 1 }, (_, i) => ({ label: `v${i}` }));
    assert.throws(() => readVariantTypeBody(list(tooMany)), /En fazla 100/);
  });
});

describe("planValueChanges", () => {
  const stored = [
    { id: "a", label: "S" },
    { id: "b", label: "M" },
    { id: "c", label: "L" },
  ];

  it("keeps ids on rename, inserts new values, removes missing ones, orders by submission", () => {
    const plan = planValueChanges(stored, [
      { id: "b", label: "Medium" },
      { label: "XL" },
      { id: "a", label: "S" },
    ]);
    assert.deepEqual(plan.update, [
      { id: "b", input: { id: "b", label: "Medium" }, sortOrder: 0 },
      { id: "a", input: { id: "a", label: "S" }, sortOrder: 2 },
    ]);
    assert.deepEqual(plan.insert, [{ input: { label: "XL" }, sortOrder: 1 }]);
    assert.deepEqual(plan.remove, ["c"]);
    assert.equal(plan.needsTwoPhase, false);
  });

  it("treats an unknown id as a new value", () => {
    const plan = planValueChanges(stored, [{ id: "zzz", label: "XS" }]);
    assert.equal(plan.insert.length, 1);
    assert.deepEqual(plan.remove.sort(), ["a", "b", "c"]);
  });

  it("needs two phases when a rename lands on a label another kept value holds", () => {
    const swap = planValueChanges(stored, [
      { id: "a", label: "M" },
      { id: "b", label: "S" },
      { id: "c", label: "L" },
    ]);
    assert.equal(swap.needsTwoPhase, true);
    // a rename that only changes case is not a collision with itself
    const recase = planValueChanges(stored, [
      { id: "a", label: "s" },
      { id: "b", label: "M" },
      { id: "c", label: "L" },
    ]);
    assert.equal(recase.needsTwoPhase, false);
  });

  it("does not count a label freed by a removal", () => {
    const plan = planValueChanges(stored, [
      { id: "a", label: "M" },
      { id: "c", label: "L" },
    ]);
    assert.deepEqual(plan.remove, ["b"]);
    assert.equal(plan.needsTwoPhase, false);
  });
});

describe("built-in size types", () => {
  it("are Beden (XS–3XL) and Pantolon bedeni (24–52), marked as size types", () => {
    const [beden, pantolon] = builtInSizeTypeInputs();
    assert.equal(beden!.name, "Beden");
    assert.equal(beden!.role, "size");
    assert.deepEqual(
      beden!.values.map((value) => value.label),
      ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
    );
    assert.equal(pantolon!.name, "Pantolon bedeni");
    assert.equal(pantolon!.values[0]!.label, "24");
    assert.equal(pantolon!.values.at(-1)!.label, "52");
    assert.equal(pantolon!.values.length, 15);
    // Each is a valid body for the API.
    for (const input of [beden!, pantolon!]) {
      assert.deepEqual(readVariantTypeBody({ ...input }).role, "size");
    }
  });

  it("are offered only while the boutique has no size type, skipping taken names", () => {
    assert.deepEqual(
      importableSizeTypeInputs([]).map((input) => input.name),
      ["Beden", "Pantolon bedeni"],
    );
    assert.deepEqual(
      importableSizeTypeInputs([{ id: "1", name: "beden", role: null }]).map((i) => i.name),
      ["Pantolon bedeni"],
    );
    assert.deepEqual(
      importableSizeTypeInputs([{ id: "1", name: "Numara", role: "size" }]),
      [],
    );
  });
});

describe("variant type role", () => {
  const base = { name: "Beden", selectionStyle: "list", values: [{ label: "S" }] };
  it("reads size / color / none and rejects anything else", () => {
    assert.equal(readVariantTypeBody({ ...base, role: "size" }).role, "size");
    assert.equal(readVariantTypeBody({ ...base, role: "color" }).role, "color");
    assert.equal(readVariantTypeBody({ ...base, role: null }).role, null);
    assert.equal(readVariantTypeBody({ ...base }).role, null);
    assert.throws(() => readVariantTypeBody({ ...base, role: "shoe" }), /Kullanım/);
  });

  it("maps a stored row, treating a missing column as no role", () => {
    assert.equal(mapVariantTypeRow({ id: "t", boutique_id: "b", role: "size" }).role, "size");
    assert.equal(mapVariantTypeRow({ id: "t", boutique_id: "b" }).role, null);
  });
});

describe("hasTypeNamed", () => {
  const types = [
    { id: "1", name: "Renk" },
    { id: "2", name: "Beden" },
  ];
  it("compares names case-insensitively, ignoring the type being edited", () => {
    assert.equal(hasTypeNamed(types, "renk"), true);
    assert.equal(hasTypeNamed(types, " BEDEN "), true);
    assert.equal(hasTypeNamed(types, "Renk", "1"), false);
    assert.equal(hasTypeNamed(types, "Boyut"), false);
  });
});

describe("variant type form", () => {
  it("splits typed or pasted text into values", () => {
    assert.deepEqual(splitValueInput("S, M ; L\n XL ,, "), ["S", "M", "L", "XL"]);
  });

  it("adds values, skipping repeats and reporting them", () => {
    const first = addValues(emptyVariantTypeForm(), ["S", "M", "s"]);
    assert.deepEqual(first.form.values.map((v) => v.label), ["S", "M"]);
    assert.deepEqual(first.skipped, ["s"]);
    const second = addValues(first.form, ["m", "L"]);
    assert.deepEqual(second.form.values.map((v) => v.label), ["S", "M", "L"]);
    assert.deepEqual(second.skipped, ["m"]);
  });

  it("stops at the value limit", () => {
    const many = Array.from({ length: VARIANT_TYPE_LIMITS.valuesMax + 3 }, (_, i) => `v${i}`);
    const { form, skipped } = addValues(emptyVariantTypeForm(), many);
    assert.equal(form.values.length, VARIANT_TYPE_LIMITS.valuesMax);
    assert.equal(skipped.length, 3);
  });

  it("moves a value up or down and stays put at the ends", () => {
    assert.deepEqual(moveValue(["a", "b", "c"], 1, -1), ["b", "a", "c"]);
    assert.deepEqual(moveValue(["a", "b", "c"], 1, 1), ["a", "c", "b"]);
    assert.deepEqual(moveValue(["a", "b", "c"], 0, -1), ["a", "b", "c"]);
    assert.deepEqual(moveValue(["a", "b", "c"], 2, 1), ["a", "b", "c"]);
  });

  it("round-trips a stored type through the form and the body", () => {
    const type = mapVariantTypeRow(
      { id: "t1", boutique_id: "b", name: "Renk", selection_style: "swatch", sort_order: 0 },
      [
        mapVariantValueRow({ id: "v2", label: "Mavi", hex: "#0000ff", sort_order: 1 }),
        mapVariantValueRow({ id: "v1", label: "Kırmızı", hex: "#ff0000", sort_order: 0 }),
      ],
    );
    assert.deepEqual(type.values.map((v) => v.id), ["v1", "v2"]);
    const body = variantTypeBody(formFromVariantType(type));
    assert.deepEqual(body, {
      name: "Renk",
      selectionStyle: "swatch",
      role: null,
      values: [
        { id: "v1", label: "Kırmızı", hex: "#ff0000", imageUrl: null },
        { id: "v2", label: "Mavi", hex: "#0000ff", imageUrl: null },
      ],
    });
    assert.deepEqual(readVariantTypeBody(body).values.map((v) => v.id), ["v1", "v2"]);
  });

  it("validates with the API's rules and the boutique's existing names", () => {
    const filled = addValues({ ...emptyVariantTypeForm(), name: "Beden" }, ["S"]).form;
    assert.equal(validateVariantTypeForm(filled), null);
    assert.match(validateVariantTypeForm({ ...filled, name: "" })!, /adı zorunlu/);
    assert.match(validateVariantTypeForm({ ...filled, values: [] })!, /En az bir değer/);
    assert.match(validateVariantTypeForm(filled, [{ id: "9", name: "beden" }])!, /zaten var/);
    assert.equal(validateVariantTypeForm(filled, [{ id: "9", name: "beden" }], "9"), null);
    assert.match(
      validateVariantTypeForm({ ...filled, selectionStyle: "swatch" })!,
      /renk veya görsel/,
    );
  });
});
