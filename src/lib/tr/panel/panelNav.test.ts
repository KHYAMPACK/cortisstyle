import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  flattenPanelNav,
  isPanelEditorRoute,
  isPanelNavGroup,
  isTrPanelNavActive,
  isTrPanelNavGroupActive,
  panelNavForProfile,
  type TrPanelNavGroup,
} from "./panelNav";

function productsGroup(profile: "fashion" | "custom_art"): TrPanelNavGroup | undefined {
  return panelNavForProfile(profile).find(
    (entry): entry is TrPanelNavGroup =>
      isPanelNavGroup(entry) && entry.id === "products",
  );
}

describe("panelNavForProfile", () => {
  it("groups Ürünler, Stok and Tanımlamalar under one heading for fashion boutiques", () => {
    const group = productsGroup("fashion");
    assert.ok(group);
    assert.deepEqual(
      group.children.map((child) => child.label),
      ["Ürünler", "Stok", "Tanımlamalar"],
    );
  });

  it("drops the whole group when a profile hides all of its pages", () => {
    assert.equal(productsGroup("custom_art"), undefined);
  });

  it("keeps the top-level order the tab bar relies on", () => {
    assert.deepEqual(
      flattenPanelNav(panelNavForProfile("fashion"))
        .slice(0, 4)
        .map((item) => item.label),
      ["Giriş", "Siparişler", "Ürünler", "Stok"],
    );
  });
});

describe("nav active state", () => {
  const group = productsGroup("fashion")!;

  it("treats product edit and create routes as the Ürünler page", () => {
    for (const path of [
      "/tr/panel/urunler",
      "/tr/panel/urun/yeni",
      "/tr/panel/urun/abc",
    ]) {
      assert.equal(isTrPanelNavActive(path, group.children[0]!), true, path);
      assert.equal(isTrPanelNavActive(path, group.children[1]!), false, path);
    }
  });

  it("marks Stok active on its own route only", () => {
    assert.equal(isTrPanelNavActive("/tr/panel/stok", group.children[1]!), true);
    assert.equal(isTrPanelNavActive("/tr/panel/stok", group.children[0]!), false);
  });

  it("marks the group active exactly when one of its pages is", () => {
    assert.equal(isTrPanelNavGroupActive("/tr/panel/stok", group), true);
    assert.equal(isTrPanelNavGroupActive("/tr/panel/urun/yeni", group), true);
    assert.equal(isTrPanelNavGroupActive("/tr/panel/siparisler", group), false);
    assert.equal(isTrPanelNavGroupActive("/tr/panel", group), false);
  });
});

describe("isPanelEditorRoute", () => {
  it("is true for the product create and edit pages", () => {
    assert.equal(isPanelEditorRoute("/tr/panel/urun/yeni"), true);
    assert.equal(isPanelEditorRoute("/tr/panel/urun/abc-123"), true);
    assert.equal(isPanelEditorRoute("/tr/panel/urun/abc-123/"), true);
  });

  it("is true for every step of the create flow", () => {
    for (const path of [
      "/tr/panel/urun/yeni",
      "/tr/panel/urun/yeni/basit",
      "/tr/panel/urun/yeni/moda",
      "/tr/panel/urun/yeni/moda/tek-parca",
    ]) {
      assert.equal(isPanelEditorRoute(path), true, path);
    }
    assert.equal(isPanelEditorRoute("/tr/panel/urun/yeni/baska"), false);
    assert.equal(isPanelEditorRoute("/tr/panel/urun/yeni/moda/x"), false);
  });

  it("keeps the normal chrome for lists and the set and bulk wizards", () => {
    for (const path of [
      "/tr/panel",
      "/tr/panel/urunler",
      "/tr/panel/stok",
      "/tr/panel/urun/takim",
      "/tr/panel/urun/toplu",
      "/tr/panel/siparisler/abc",
    ]) {
      assert.equal(isPanelEditorRoute(path), false, path);
    }
  });
});

describe("categories routes", () => {
  it("are editor routes for a single category and normal pages otherwise", () => {
    assert.equal(isPanelEditorRoute("/tr/panel/tanimlamalar/kategoriler/yeni"), true);
    assert.equal(isPanelEditorRoute("/tr/panel/tanimlamalar/kategoriler/abc-123"), true);
    assert.equal(isPanelEditorRoute("/tr/panel/tanimlamalar/kategoriler"), false);
    assert.equal(isPanelEditorRoute("/tr/panel/tanimlamalar"), false);
  });

  it("keep the Ürünler group open on the Tanımlamalar pages", () => {
    const group = productsGroup("fashion")!;
    const definitions = group.children[2]!;
    assert.equal(isTrPanelNavActive("/tr/panel/tanimlamalar/kategoriler", definitions), true);
    // Varyant Türleri edits in a drawer, so it keeps the normal panel chrome.
    assert.equal(isPanelEditorRoute("/tr/panel/tanimlamalar/varyant-turleri"), false);
    assert.equal(isTrPanelNavActive("/tr/panel/tanimlamalar/varyant-turleri", definitions), true);
    assert.equal(isTrPanelNavGroupActive("/tr/panel/tanimlamalar", group), true);
    assert.equal(isTrPanelNavActive("/tr/panel/tanimlamalar", group.children[0]!), false);
  });
});
