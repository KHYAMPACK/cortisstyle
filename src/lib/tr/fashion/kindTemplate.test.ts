import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TR_BOUTIQUE_CATEGORIES } from "./categories";
import { fashionCategoryTemplate } from "./categoryTemplate";
import { getConstructionFeatureGroups } from "./dressFeatures";
import { fashionKindKeyForCategory, fashionKindKeyForGarment, fashionKindTemplate } from "./kindTemplate";
import { isValidAttributeKey, planKindImport } from "@/lib/tr/productKinds/rules";

const template = fashionKindTemplate();
const kind = (systemKey: string) => template.kinds.find((entry) => entry.systemKey === systemKey)!;
const keys = (systemKey: string) => kind(systemKey).attributes.map((link) => link.key);

/** The editor's chip groups for a family, as `features` keys, in order. */
function editorKeys(family: "elbise" | "ust-giyim" | "alt-giyim", category?: string) {
  return getConstructionFeatureGroups(family, category).map((group) =>
    group.key === "hem" ? "neckHem" : group.key,
  );
}

describe("fashionKindTemplate", () => {
  it("has valid, unique field keys and only refers to its own fields", () => {
    const fieldKeys = template.attributes.map((attribute) => attribute.key);
    assert.equal(new Set(fieldKeys).size, fieldKeys.length);
    for (const key of fieldKeys) assert.ok(isValidAttributeKey(key), key);
    for (const entry of template.kinds) {
      for (const link of entry.attributes) {
        assert.ok(fieldKeys.includes(link.key), `${entry.systemKey} → ${link.key}`);
        const field = template.attributes.find((attribute) => attribute.key === link.key)!;
        for (const option of link.options ?? []) {
          assert.ok(field.options.includes(option), `${entry.systemKey} ${link.key}: ${option}`);
        }
      }
    }
  });

  it("gives each garment kind exactly the fields the fashion editor shows", () => {
    // Cinsiyet chips first, then the family's groups, then Detay (alt giyim), Renk, Kompozisyon.
    assert.deepEqual(keys("elbise"), ["gender", ...editorKeys("elbise"), "color", "composition"]);
    assert.deepEqual(keys("ust-giyim"), [
      "gender",
      ...editorKeys("ust-giyim"),
      "color",
      "composition",
    ]);
    assert.deepEqual(keys("etek"), [
      "gender",
      ...editorKeys("alt-giyim", "etek"),
      "ornament",
      "color",
      "composition",
    ]);
    assert.deepEqual(keys("pantolon"), [
      "gender",
      ...editorKeys("alt-giyim", "pantolon"),
      "ornament",
      "color",
      "composition",
    ]);
  });

  it("offers each garment kind the editor's options for its family", () => {
    const options = (systemKey: string, key: string) => {
      const link = kind(systemKey).attributes.find((entry) => entry.key === key)!;
      return link.options ?? template.attributes.find((field) => field.key === key)!.options;
    };
    const editorOptions = (family: "elbise" | "ust-giyim" | "alt-giyim", key: string, category?: string) =>
      getConstructionFeatureGroups(family, category)
        .find((group) => (group.key === "hem" ? "neckHem" : group.key) === key)!
        .options.map((option) => option.label);

    for (const key of editorKeys("elbise")) {
      assert.deepEqual(options("elbise", key), editorOptions("elbise", key), `elbise ${key}`);
    }
    for (const key of editorKeys("ust-giyim")) {
      assert.deepEqual(options("ust-giyim", key), editorOptions("ust-giyim", key), `üst ${key}`);
    }
    for (const key of editorKeys("alt-giyim", "etek")) {
      assert.deepEqual(options("etek", key), editorOptions("alt-giyim", key, "etek"), `etek ${key}`);
    }
    for (const key of editorKeys("alt-giyim", "pantolon")) {
      assert.deepEqual(
        options("pantolon", key),
        editorOptions("alt-giyim", key, "pantolon"),
        `pantolon ${key}`,
      );
    }
  });

  it("imports cleanly into a boutique with the fashion categories", () => {
    const categories = fashionCategoryTemplate().map((entry, index) => ({
      id: `c-${index}`,
      systemKey: entry.key,
    }));
    const plan = planKindImport(template, {
      attributes: [],
      kinds: [],
      variantTypes: [],
      categories,
    });
    assert.equal(plan.attributes.length, template.attributes.length);
    assert.equal(plan.kinds.length, template.kinds.length);
    for (const entry of plan.kinds) assert.ok(entry.suggestedCategoryId, entry.systemKey);
  });
});

describe("fashionKindKeyForGarment", () => {
  it("maps every built-in category except the legacy Dış giyim", () => {
    const expected: Record<string, string | null> = {
      elbise: "elbise",
      "ust-giyim": "ust-giyim",
      bluz: "ust-giyim",
      gomlek: "ust-giyim",
      tshirt: "ust-giyim",
      ceket: "ust-giyim",
      "deri-ceket": "ust-giyim",
      "kurk-mont": "ust-giyim",
      takim: "takim",
      "alt-giyim": "pantolon",
      etek: "etek",
      pantolon: "pantolon",
      "kot-pantolon": "pantolon",
      esofman: "pantolon",
      aksesuar: "aksesuar",
      canta: "aksesuar",
      ev: "ev",
      "nevresim-takimi": "ev",
      "dis-giyim": null,
    };
    for (const [id, key] of Object.entries(expected)) {
      assert.equal(fashionKindKeyForGarment(id), key, id);
    }
    for (const entry of TR_BOUTIQUE_CATEGORIES) {
      if (entry.id === "dis-giyim") continue;
      assert.ok(fashionKindKeyForGarment(entry.id), entry.id);
    }
    assert.equal(fashionKindKeyForGarment(null), null);
    assert.equal(fashionKindKeyForGarment("yeni-sezon"), null);
  });

  it("reads a boutique's renamed and owner-made categories through system keys", () => {
    const categories = [
      { id: "c1", parentId: null, slug: "elbiseler", systemKey: "elbise" },
      { id: "c2", parentId: "c1", slug: "abiye", systemKey: null },
      { id: "c3", parentId: null, slug: "yeni-sezon", systemKey: null },
      { id: "c4", parentId: null, slug: "takimlar", systemKey: "takim" },
    ];
    assert.equal(fashionKindKeyForCategory("elbiseler", categories), "elbise");
    assert.equal(fashionKindKeyForCategory("abiye", categories), "elbise");
    assert.equal(fashionKindKeyForCategory("takimlar", categories), "takim");
    assert.equal(fashionKindKeyForCategory("yeni-sezon", categories), null);
  });
});
