import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildProductRedirectMap,
  productPagePath,
  productRedirectKey,
  productRedirectTarget,
} from "./productRedirectRules";

describe("product redirects", () => {
  it("finds the product segment on a boutique host and on the platform", () => {
    assert.deepEqual(productPagePath("/urun/abc", "lilabutik"), {
      boutiqueSlug: "lilabutik",
      param: "abc",
      prefix: "/urun/",
    });
    assert.deepEqual(productPagePath("/tr/lilabutik/urun/maxi-elbise/", null), {
      boutiqueSlug: "lilabutik",
      param: "maxi-elbise",
      prefix: "/tr/lilabutik/urun/",
    });
    assert.equal(productPagePath("/urunler", "lilabutik"), null);
    assert.equal(productPagePath("/urun/abc", null), null);
    assert.equal(productPagePath("/tr/lilabutik/urun/a/b", null), null);
  });

  it("keeps the query and opens a merged colour", () => {
    assert.deepEqual(
      productRedirectTarget({ prefix: "/urun/" }, { toParam: "s1", color: "Kırmızı" }, "?utm_source=ig&renk=mavi"),
      { pathname: "/urun/s1", search: "?utm_source=ig&renk=kirmizi" },
    );
    assert.deepEqual(
      productRedirectTarget({ prefix: "/tr/b/urun/" }, { toParam: "yeni-ad", color: null }, ""),
      { pathname: "/tr/b/urun/yeni-ad", search: "" },
    );
  });

  it("maps merged products and old slugs, following a slug into a merge", () => {
    const map = buildProductRedirectMap({
      boutiques: [{ id: "b", slug: "Lilabutik" }],
      merged: [{ id: "red", boutiqueId: "b", slug: "kirmizi-elbise", mergedInto: "keep", color: "Kırmızı" }],
      slugRedirects: [
        { boutiqueId: "b", oldSlug: "eski-kirmizi", productId: "red" },
        { boutiqueId: "b", oldSlug: "eski-ad", productId: "other" },
        { boutiqueId: "b", oldSlug: "same", productId: "self" },
      ],
      currentSlugs: new Map([["keep", "maxi-elbise"], ["other", null], ["self", "same"]]),
    });
    assert.deepEqual(map.get(productRedirectKey("lilabutik", "red")), { toParam: "maxi-elbise", color: "Kırmızı" });
    assert.deepEqual(map.get(productRedirectKey("lilabutik", "kirmizi-elbise")), { toParam: "maxi-elbise", color: "Kırmızı" });
    assert.deepEqual(map.get(productRedirectKey("lilabutik", "eski-kirmizi")), { toParam: "maxi-elbise", color: "Kırmızı" });
    assert.deepEqual(map.get(productRedirectKey("lilabutik", "eski-ad")), { toParam: "other", color: null });
    assert.equal(map.get(productRedirectKey("lilabutik", "same")), undefined);
  });
});
