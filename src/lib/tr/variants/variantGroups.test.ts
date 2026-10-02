import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addImagesToRows,
  groupHasImage,
  groupVariantRows,
  toggleGroupImage,
  type VariantRowDraft,
  type VariantsFormState,
} from "./variantForm";

function row(key: string, ids: string[], stock: string, images: string[] = [], active = true): VariantRowDraft {
  return { key, optionValueIds: ids, sku: "", barcode: "", price: "", stock, images, active };
}

const form: VariantsFormState = {
  typeIds: ["renk", "beden"],
  rows: [
    row("r-s", ["red", "s"], "1", ["a"]),
    row("b-s", ["blue", "s"], "2"),
    row("r-m", ["red", "m"], "3", ["a"], false),
    row("b-m", ["blue", "m"], "4"),
  ],
};

describe("variant sections", () => {
  it("groups by the photo option, in the type's order", () => {
    const groups = groupVariantRows(form, "renk", ["blue", "red"]);
    assert.deepEqual(groups.map((g) => [g.valueId, g.rows.map((r) => r.key), g.stock, g.activeCount]), [
      ["blue", ["b-s", "b-m"], 6, 2],
      ["red", ["r-s", "r-m"], 1, 1],
    ]);
  });

  it("keeps a product without a photo option in one section", () => {
    const single = { typeIds: ["beden"], rows: [row("s", ["s"], "1"), row("m", ["m"], "2")] };
    const groups = groupVariantRows(single, null);
    assert.equal(groups.length, 1);
    assert.equal(groups[0]!.valueId, null);
    assert.equal(groups[0]!.stock, 3);
    assert.deepEqual(groupVariantRows({ typeIds: [], rows: [] }, null), []);
    // Two options but none with photos: one section too.
    assert.equal(groupVariantRows(form, null).length, 1);
  });

  it("groups by a photo option that isn't the first", () => {
    const sizeFirst = {
      typeIds: ["beden", "renk"],
      rows: [row("s-r", ["s", "red"], "1"), row("s-b", ["s", "blue"], "2"), row("m-r", ["m", "red"], "3")],
    };
    const groups = groupVariantRows(sizeFirst, "renk", ["red", "blue"]);
    assert.deepEqual(groups.map((g) => [g.valueId, g.rows.map((r) => r.key)]), [
      ["red", ["s-r", "m-r"]],
      ["blue", ["s-b"]],
    ]);
  });

  it("toggles a photo for the whole colour", () => {
    const red = ["r-s", "r-m"];
    assert.equal(groupHasImage(form.rows.filter((r) => red.includes(r.key)), "a"), true);
    const removed = toggleGroupImage(form, red, "a");
    assert.deepEqual(removed.rows.map((r) => r.images), [[], [], [], []]);
    const added = toggleGroupImage(removed, red, "b");
    assert.deepEqual(added.rows.map((r) => r.images), [["b"], [], ["b"], []]);
    // Partly picked: adding makes it complete without duplicates.
    const partial = { ...form, rows: [row("x", ["red", "s"], "1", ["c"]), row("y", ["red", "m"], "1")] };
    assert.deepEqual(toggleGroupImage(partial, ["x", "y"], "c").rows.map((r) => r.images), [["c"], ["c"]]);
  });

  it("adds uploaded photos to a colour's rows", () => {
    const next = addImagesToRows(form, ["r-s", "r-m"], ["a", "n"]);
    assert.deepEqual(next.rows.map((r) => r.images), [["a", "n"], [], ["a", "n"], []]);
  });
});
