import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  categoryFormFromCategory,
  categoryInput,
  emptyCategoryForm,
  validateCategoryForm,
  type CategoryFormState,
} from "./categoryForm";
import type { TrCategory } from "@/lib/tr/categories/types";

function form(overrides: Partial<CategoryFormState> = {}): CategoryFormState {
  return { ...emptyCategoryForm(), name: "Çanta", ...overrides };
}

describe("validateCategoryForm", () => {
  it("needs a name", () => {
    assert.equal(validateCategoryForm(form()), null);
    assert.match(validateCategoryForm(form({ name: "  " }))!, /adı/);
  });

  it("validates the slug, and requires one when editing", () => {
    const seo = (slug: string) => ({ ...emptyCategoryForm().seo, slug });
    assert.equal(validateCategoryForm(form({ seo: seo("canta") })), null);
    assert.match(validateCategoryForm(form({ seo: seo("Çanta!") }))!, /Slug/);
    assert.match(validateCategoryForm(form(), { requireSlug: true })!, /boş/);
    assert.equal(validateCategoryForm(form()), null);
  });

  it("rejects an overlong description and a bad canonical path", () => {
    assert.match(validateCategoryForm(form({ description: "x".repeat(2001) }))!, /Açıklama/);
    assert.match(
      validateCategoryForm(form({ seo: { ...emptyCategoryForm().seo, canonical: "a b" } }))!,
      /Canonical/,
    );
  });
});

describe("categoryInput", () => {
  it("leaves the slug out on create when it is empty, and sends it on edit", () => {
    assert.equal("slug" in categoryInput(form(), { isEdit: false }), false);
    assert.equal(
      categoryInput(form({ seo: { ...emptyCategoryForm().seo, slug: "canta-" } }), { isEdit: true }).slug,
      "canta",
    );
  });

  it("turns empty fields into null and a chosen parent into its id", () => {
    const input = categoryInput(form({ parentId: "p1", sortCriterion: "price_asc" }), {
      isEdit: false,
    });
    assert.equal(input.parentId, "p1");
    assert.equal(input.sortCriterion, "price_asc");
    assert.equal(input.description, null);
    assert.equal(input.imageUrl, null);
    assert.equal(categoryInput(form(), { isEdit: false }).parentId, null);
    assert.equal(categoryInput(form(), { isEdit: false }).sortCriterion, null);
  });
});

describe("categoryFormFromCategory", () => {
  it("loads a saved category into the form", () => {
    const category = {
      name: "Çanta",
      parentId: "p1",
      description: "El yapımı",
      imageUrl: "https://cdn/x.jpg",
      sortCriterion: "newest",
      slug: "canta",
      seo: { title: "Çanta modelleri", noindex: true },
    } as TrCategory;
    const state = categoryFormFromCategory(category);
    assert.equal(state.parentId, "p1");
    assert.equal(state.sortCriterion, "newest");
    assert.equal(state.seo.slug, "canta");
    assert.equal(state.seo.title, "Çanta modelleri");
    assert.equal(state.seo.noindex, true);
  });
});
