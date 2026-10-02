import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  categoryAndDescendantIds,
  categoryPath,
  categoryPathLabel,
  childrenOf,
  descendantIds,
  flattenCategoryTree,
  parentOptions,
  slugsInScope,
  visibleCategoryRows,
  wouldCreateCycle,
  type TrCategoryNode,
} from "./tree";

const cats: TrCategoryNode[] = [
  { id: "giyim", parentId: null, name: "Giyim" },
  { id: "ust", parentId: "giyim", name: "Üst giyim" },
  { id: "gomlek", parentId: "ust", name: "Gömlek" },
  { id: "alt", parentId: "giyim", name: "Alt giyim" },
  { id: "aksesuar", parentId: null, name: "Aksesuar" },
];

describe("flattenCategoryTree", () => {
  it("lists each parent followed by its children, with depth", () => {
    assert.deepEqual(
      flattenCategoryTree(cats).map((row) => `${"-".repeat(row.depth)}${row.category.id}`),
      ["aksesuar", "giyim", "-alt", "-ust", "--gomlek"],
    );
  });

  it("orders siblings by sortOrder first, then by name in Turkish", () => {
    const list: TrCategoryNode[] = [
      { id: "b", parentId: null, name: "Çanta" },
      { id: "a", parentId: null, name: "Zarf", sortOrder: -1 },
      { id: "c", parentId: null, name: "Şal" },
    ];
    assert.deepEqual(childrenOf(list, null).map((e) => e.id), ["a", "b", "c"]);
  });

  it("shows a category whose parent is missing as a root and survives a cycle", () => {
    const orphan: TrCategoryNode[] = [{ id: "x", parentId: "gone", name: "X" }];
    assert.deepEqual(flattenCategoryTree(orphan).map((r) => r.depth), [0]);

    const loop: TrCategoryNode[] = [
      { id: "a", parentId: "b", name: "A" },
      { id: "b", parentId: "a", name: "B" },
    ];
    assert.equal(flattenCategoryTree(loop).length, 2);
  });
});

describe("descendants", () => {
  it("collects every level below a category", () => {
    assert.deepEqual(descendantIds(cats, "giyim").sort(), ["alt", "gomlek", "ust"]);
    assert.deepEqual(descendantIds(cats, "gomlek"), []);
    assert.deepEqual(categoryAndDescendantIds(cats, "ust").sort(), ["gomlek", "ust"]);
  });
});

describe("wouldCreateCycle", () => {
  it("rejects a category as its own parent or under its own descendant", () => {
    assert.equal(wouldCreateCycle(cats, "giyim", "giyim"), true);
    assert.equal(wouldCreateCycle(cats, "giyim", "gomlek"), true);
  });

  it("allows moving to another branch or to the top", () => {
    assert.equal(wouldCreateCycle(cats, "gomlek", "aksesuar"), false);
    assert.equal(wouldCreateCycle(cats, "ust", null), false);
  });
});

describe("categoryPath", () => {
  it("runs from the root down to the category", () => {
    assert.deepEqual(categoryPath(cats, "gomlek").map((e) => e.id), ["giyim", "ust", "gomlek"]);
    assert.equal(categoryPathLabel(cats, "gomlek"), "Giyim › Üst giyim › Gömlek");
    assert.equal(categoryPathLabel(cats, "yok"), "");
  });
});

describe("parentOptions", () => {
  it("lists the tree with depth dashes, leaving out the category and its descendants", () => {
    assert.deepEqual(
      parentOptions(cats).map((o) => o.label),
      ["Aksesuar", "Giyim", "— Alt giyim", "— Üst giyim", "— — Gömlek"],
    );
    assert.deepEqual(
      parentOptions(cats, "ust").map((o) => o.id),
      ["aksesuar", "giyim", "alt"],
    );
  });
});

describe("slugsInScope", () => {
  const withSlugs = cats.map((c) => ({ ...c, slug: `s-${c.id}` }));

  it("is the category's slug plus every descendant's", () => {
    assert.deepEqual([...slugsInScope(withSlugs, "s-giyim")].sort(), [
      "s-alt",
      "s-giyim",
      "s-gomlek",
      "s-ust",
    ]);
    assert.deepEqual([...slugsInScope(withSlugs, "s-gomlek")], ["s-gomlek"]);
  });

  it("falls back to the slug itself when it is not a known category", () => {
    assert.deepEqual([...slugsInScope(withSlugs, "bilinmeyen")], ["bilinmeyen"]);
  });
});

describe("visibleCategoryRows", () => {
  const tree = [
    { id: "a", parentId: null, name: "Elbise", sortOrder: 0 },
    { id: "b", parentId: "a", name: "Abiye", sortOrder: 0 },
    { id: "c", parentId: "b", name: "Uzun abiye", sortOrder: 0 },
    { id: "d", parentId: null, name: "Bluz", sortOrder: 1 },
  ];

  it("hides the children of a collapsed parent", () => {
    const rows = visibleCategoryRows(tree, new Set());
    assert.deepEqual(rows.map((row) => row.category.id), ["a", "d"]);
    assert.equal(rows[0]!.hasChildren, true);
    assert.equal(rows[1]!.hasChildren, false);
  });

  it("shows children, with their parent path, once expanded", () => {
    const rows = visibleCategoryRows(tree, new Set(["a"]));
    assert.deepEqual(rows.map((row) => row.category.id), ["a", "b", "d"]);
    assert.equal(rows[1]!.parentPath, "Elbise");
    const deeper = visibleCategoryRows(tree, new Set(["a", "b"]));
    assert.deepEqual(deeper.map((row) => row.category.id), ["a", "b", "c", "d"]);
    assert.equal(deeper[2]!.parentPath, "Elbise › Abiye");
  });

  it("lists every match flat while searching", () => {
    const rows = visibleCategoryRows(tree, new Set(), "abi");
    assert.deepEqual(rows.map((row) => row.category.id), ["b", "c"]);
    assert.equal(rows[1]!.depth, 0);
  });
});
