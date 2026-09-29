import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveBoutiqueAuthMailBrand } from "./templates";

describe("resolveBoutiqueAuthMailBrand", () => {
  it("keeps lilabutik's PNG logo", () => {
    const brand = resolveBoutiqueAuthMailBrand({
      slug: "lilabutik",
      name: "Lila Butik",
      logoUrl: "/tr/boutiques/lilabutik/logo.svg",
    });
    assert.match(brand.logoAbsoluteUrl ?? "", /\/tr\/boutiques\/lilabutik\/logo\.png(\?|$)/);
    assert.equal(brand.name, "Lila Boutique");
  });

  it("uses the boutique's own PNG logo from the database", () => {
    const brand = resolveBoutiqueAuthMailBrand({
      slug: "deneme-butik",
      name: "Deneme Butik",
      logoUrl: "https://cdn.test/deneme/logo.png",
    });
    assert.equal(brand.logoAbsoluteUrl, "https://cdn.test/deneme/logo.png");
    assert.equal(brand.name, "Deneme Butik");
  });

  it("leaves an SVG logo out, even with a cache-buster", () => {
    for (const logoUrl of ["/tr/boutiques/x/logo.svg", "/tr/boutiques/x/logo.SVG?v=2"]) {
      assert.equal(
        resolveBoutiqueAuthMailBrand({ slug: "x", name: "X", logoUrl }).logoAbsoluteUrl,
        null,
      );
    }
  });

  it("sends no logo when the boutique has none", () => {
    assert.equal(
      resolveBoutiqueAuthMailBrand({ slug: "x", name: "X", logoUrl: null }).logoAbsoluteUrl,
      null,
    );
  });
});
