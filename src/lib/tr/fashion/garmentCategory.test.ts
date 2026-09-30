import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  categoryForGarmentKey,
  garmentCategoryFor,
  primaryCategorySlug,
  withGarmentKeyPrimary,
} from "./garmentCategory";

const categories = [
  { id: "c-elbise", parentId: null, slug: "elbiseler", systemKey: "elbise" },
  { id: "c-abiye", parentId: "c-elbise", slug: "abiye", systemKey: null },
  { id: "c-ust", parentId: null, slug: "ust-giyim", systemKey: "ust-giyim" },
  { id: "c-bluz", parentId: "c-ust", slug: "bluz", systemKey: "bluz" },
  { id: "c-takim", parentId: "c-ust", slug: "takim", systemKey: "takim" },
  { id: "c-yeni", parentId: null, slug: "yeni-sezon", systemKey: null },
];

describe("garmentCategoryFor", () => {
  it("passes slugs through for a boutique on the built-in tree", () => {
    assert.equal(garmentCategoryFor("elbise", null), "elbise");
    assert.equal(garmentCategoryFor(null, null), null);
  });

  it("uses the category's key, so a renamed slug still works", () => {
    assert.equal(garmentCategoryFor("elbiseler", categories), "elbise");
    assert.equal(garmentCategoryFor("bluz", categories), "bluz");
  });

  it("inherits the nearest keyed ancestor for an owner-made subcategory", () => {
    assert.equal(garmentCategoryFor("abiye", categories), "elbise");
  });

  it("keeps an unkeyed slug as it is", () => {
    assert.equal(garmentCategoryFor("yeni-sezon", categories), "yeni-sezon");
    assert.equal(garmentCategoryFor("unknown", categories), "unknown");
  });
});

describe("mapping back to the boutique's categories", () => {
  it("finds the category for a built-in id", () => {
    assert.equal(categoryForGarmentKey("takim", categories)?.id, "c-takim");
    assert.equal(categoryForGarmentKey("pantolon", categories), null);
  });

  it("makes the keyed category primary, adding it when missing", () => {
    assert.deepEqual(
      withGarmentKeyPrimary({ ids: ["c-yeni"], primaryId: "c-yeni" }, "bluz", categories),
      { ids: ["c-yeni", "c-bluz"], primaryId: "c-bluz" },
    );
    assert.deepEqual(
      withGarmentKeyPrimary({ ids: [], primaryId: null }, "pantolon", categories),
      { ids: [], primaryId: null },
    );
    assert.equal(
      primaryCategorySlug({ ids: ["c-bluz"], primaryId: "c-bluz" }, categories),
      "bluz",
    );
  });
});
