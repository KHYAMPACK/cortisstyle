import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planCategoryImport } from "@/lib/tr/categories/importPlan";
import { customTaxonomy, taxonomyNodesFromCategories } from "@/lib/tr/categories/taxonomy";
import { fashionCategoryAliases, fashionCategoryTemplate } from "./categoryTemplate";
import { fashionShopAllLabelFor, legacyFashionTaxonomy as legacy } from "./legacyTaxonomy";

/** lilabutik's categories in production (2026-09-30). */
const LILA = ["elbise", "pantolon", "bluz", "ceket", "gomlek", "takim", "etek", "tshirt"];

/** The boutique's categories as "Hazır kategorileri içe aktar" creates them. */
function importedCategories() {
  const plan = planCategoryImport({
    template: fashionCategoryTemplate(),
    aliases: fashionCategoryAliases(),
    products: LILA.map((category, index) => ({ id: `p${index}`, category })),
  });
  return plan.entries.map((entry, index) => ({
    id: `id-${entry.slug}`,
    parentId: entry.parentSlug ? `id-${entry.parentSlug}` : null,
    name: entry.name,
    slug: entry.slug,
    imageUrl: null as string | null,
    sortOrder: index,
    systemKey: entry.systemKey,
  }));
}

const custom = customTaxonomy(
  taxonomyNodesFromCategories(importedCategories(), fashionShopAllLabelFor),
);
const ids = fashionCategoryTemplate().map((entry) => entry.key);
const pick = (list: Array<{ id: string; label: string }>) =>
  list.map((entry) => [entry.id, entry.label]);

describe("the imported tree renders like the built-in one", () => {
  it("has the same menu: roots and their subcategories", () => {
    assert.deepEqual(pick(custom.roots()), pick(legacy.roots()));
    for (const root of legacy.roots()) {
      assert.deepEqual(pick(custom.navChildren(root.id)), pick(legacy.navChildren(root.id)), root.id);
    }
  });

  it("has the same labels and 'Tüm …' copy for every category", () => {
    for (const id of [...ids, null, "bilinmeyen-kategori"]) {
      assert.equal(custom.label(id), legacy.label(id), String(id));
      assert.equal(custom.displayLabel(id, "x"), legacy.displayLabel(id, "x"), String(id));
      assert.equal(custom.shopAllLabel(id), legacy.shopAllLabel(id), String(id));
      assert.equal(custom.rootId(id), legacy.rootId(id), String(id));
    }
  });

  it("filters products the same way", () => {
    for (const product of LILA) {
      for (const filter of [...ids, null]) {
        assert.equal(
          custom.isMatch(product, filter),
          legacy.isMatch(product, filter),
          `${product} in ${filter}`,
        );
      }
    }
  });

  it("lists the categories lilabutik's products use, in the same order", () => {
    const products = LILA.map((category) => ({ category }));
    assert.deepEqual(pick(custom.forProducts(products)), pick(legacy.forProducts(products)));
    for (const id of LILA) assert.equal(custom.canonicalize(id), legacy.canonicalize(id));
  });

  it("offers the same categories to file under (except the legacy-only Dış giyim)", () => {
    assert.deepEqual(
      pick(custom.assignable()),
      pick(legacy.assignable().filter((entry) => entry.id !== "dis-giyim")),
    );
  });
});

describe("the boutique's own changes", () => {
  it("shows a renamed category and an owner-made subcategory", () => {
    const categories = importedCategories().map((category) =>
      category.slug === "bluz" ? { ...category, name: "Bluzlar" } : category,
    );
    categories.push({
      id: "id-abiye",
      parentId: "id-elbise",
      name: "Abiye",
      slug: "abiye",
      imageUrl: "https://cdn.test/abiye.jpg",
      sortOrder: 99,
      systemKey: null,
    });
    const taxonomy = customTaxonomy(
      taxonomyNodesFromCategories(categories, fashionShopAllLabelFor),
    );
    assert.equal(taxonomy.label("bluz"), "Bluzlar");
    assert.equal(taxonomy.shopAllLabel("bluz"), "Tüm bluzlar");
    assert.deepEqual(pick(taxonomy.navChildren("elbise")), [["abiye", "Abiye"]]);
    assert.equal(taxonomy.isMatch("abiye", "elbise"), true);
    assert.equal(taxonomy.imageUrl("abiye"), "https://cdn.test/abiye.jpg");
  });
});
