import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { plpCategory, plpHref, plpPathPrefix } from "./plpLocation";

describe("plpPathPrefix", () => {
  it("strips the list part of the path, on a custom domain and the platform", () => {
    assert.equal(plpPathPrefix("/urunler"), "");
    assert.equal(plpPathPrefix("/kategori/elbise"), "");
    assert.equal(plpPathPrefix("/tr/lilabutik/urunler"), "/tr/lilabutik");
    assert.equal(plpPathPrefix("/tr/lilabutik/kategori/elbise/"), "/tr/lilabutik");
  });
});

describe("plpCategory", () => {
  it("prefers the category in the path over a legacy query parameter", () => {
    assert.equal(plpCategory("bluz", new URLSearchParams("kategori=elbise")), "bluz");
    assert.equal(plpCategory(null, new URLSearchParams("kategori=elbise")), "elbise");
    assert.equal(plpCategory(null, new URLSearchParams("")), null);
  });
});

describe("plpHref", () => {
  const onCategory = { pathname: "/kategori/elbise", search: "sira=new", routeCategory: "elbise" };

  it("keeps the category in the path while other filters change", () => {
    assert.equal(
      plpHref({ ...onCategory, patch: { renk: "Siyah" } }),
      "/kategori/elbise?sira=new&renk=Siyah",
    );
    assert.equal(plpHref({ ...onCategory, patch: { sira: null } }), "/kategori/elbise");
  });

  it("moves to another category's path, keeping the filters", () => {
    assert.equal(
      plpHref({ ...onCategory, patch: { kategori: "bluz" } }),
      "/kategori/bluz?sira=new",
    );
  });

  it("goes back to the full list when the category is cleared", () => {
    assert.equal(plpHref({ ...onCategory, patch: { kategori: null } }), "/urunler?sira=new");
  });

  it("treats 'sale' as the discount filter on the full list", () => {
    assert.equal(
      plpHref({ ...onCategory, patch: { kategori: "sale" } }),
      "/urunler?sira=new&indirim=1",
    );
  });

  it("turns a legacy ?kategori= into a path, on the platform address", () => {
    assert.equal(
      plpHref({
        pathname: "/tr/lilabutik/urunler",
        search: "kategori=elbise&beden=M",
        routeCategory: null,
        patch: { fiyat: "0-500" },
      }),
      "/tr/lilabutik/kategori/elbise?beden=M&fiyat=0-500",
    );
  });

  it("encodes the slug", () => {
    assert.equal(
      plpHref({ pathname: "/urunler", search: "", routeCategory: null, patch: { kategori: "yeni sezon" } }),
      "/kategori/yeni%20sezon",
    );
  });
});
