import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planCategoryImport } from "./importPlan";

const template = [
  { key: "bluz", name: "Bluz", parentKey: "ust-giyim" },
  { key: "elbise", name: "Elbise", parentKey: null },
  { key: "ust-giyim", name: "Üst giyim", parentKey: null },
  { key: "mont", name: "Mont", parentKey: "ust-giyim" },
];

describe("planCategoryImport", () => {
  it("keeps each key as slug and system key, parents before children", () => {
    const { entries } = planCategoryImport({ template, products: [] });
    assert.deepEqual(
      entries.map((entry) => [entry.slug, entry.parentSlug, entry.systemKey]),
      [
        ["elbise", null, "elbise"],
        ["ust-giyim", null, "ust-giyim"],
        ["bluz", "ust-giyim", "bluz"],
        ["mont", "ust-giyim", "mont"],
      ],
    );
  });

  it("assigns every product to the category matching its stored category", () => {
    const { assignments } = planCategoryImport({
      template,
      products: [
        { id: "p1", category: "elbise" },
        { id: "p2", category: "bluz" },
        { id: "p3", category: null },
      ],
    });
    assert.deepEqual(assignments, [
      { productId: "p1", slug: "elbise" },
      { productId: "p2", slug: "bluz" },
    ]);
  });

  it("maps aliases, and keeps an unknown category as a top-level one", () => {
    const { entries, assignments } = planCategoryImport({
      template,
      aliases: { "kase-kaban": "mont" },
      products: [
        { id: "p1", category: "kase-kaban" },
        { id: "p2", category: "abiye-ozel" },
        { id: "p3", category: "abiye-ozel" },
      ],
    });
    assert.deepEqual(assignments, [
      { productId: "p1", slug: "mont" },
      { productId: "p2", slug: "abiye-ozel" },
      { productId: "p3", slug: "abiye-ozel" },
    ]);
    const extra = entries.filter((entry) => entry.slug === "abiye-ozel");
    assert.deepEqual(extra, [
      { slug: "abiye-ozel", name: "Abiye Ozel", parentSlug: null, systemKey: null },
    ]);
  });
});
