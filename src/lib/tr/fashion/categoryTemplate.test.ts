import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planCategoryImport } from "@/lib/tr/categories/importPlan";
import { fashionCategoryAliases, fashionCategoryTemplate } from "./categoryTemplate";

describe("fashion category template", () => {
  const template = fashionCategoryTemplate();
  const keys = template.map((entry) => entry.key);

  it("has the roots and shop leaves, not the hidden variants or Dış giyim", () => {
    for (const key of ["elbise", "ust-giyim", "alt-giyim", "aksesuar", "ev", "bluz", "takim", "pantolon", "canta", "nevresim"]) {
      assert.ok(keys.includes(key), key);
    }
    for (const key of ["kase-kaban", "kot-pantolon", "deri-ceket", "nevresim-takimi", "dis-giyim"]) {
      assert.ok(!keys.includes(key), key);
    }
    assert.equal(template.length, 23);
    assert.equal(new Set(keys).size, keys.length);
  });

  it("files hidden variants under their shop leaf", () => {
    const aliases = fashionCategoryAliases();
    assert.equal(aliases["kase-kaban"], "mont");
    assert.equal(aliases["kot-pantolon"], "pantolon");
  });

  it("keeps every lilabutik category as the same slug", () => {
    const products = ["elbise", "pantolon", "bluz", "ceket", "gomlek", "takim", "etek", "tshirt"].map(
      (category, index) => ({ id: `p${index}`, category }),
    );
    const plan = planCategoryImport({ template, aliases: fashionCategoryAliases(), products });
    assert.deepEqual(
      plan.assignments.map((assignment) => assignment.slug),
      products.map((product) => product.category),
    );
    // Nothing extra had to be created for them.
    assert.equal(plan.entries.length, template.length);
  });
});
