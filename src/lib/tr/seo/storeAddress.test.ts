import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  storeAddress,
  storeCategoryPath,
  storeCategoryUrl,
  storeCategoryUrlPrefix,
  storeProductPath,
  storeProductUrl,
  storeProductUrlPrefix,
} from "./storeAddress";

const onDomain = { boutiqueSlug: "lilabutik", customDomain: "lilaboutiquedenizli.com" };
const onPlatform = { boutiqueSlug: "deneme-butik", customDomain: null };

describe("storeAddress", () => {
  it("uses the custom domain when there is one, without www", () => {
    assert.deepEqual(storeAddress({ ...onDomain, customDomain: "WWW.Lilaboutiquedenizli.com" }), {
      mode: "boutique-domain",
      host: "lilaboutiquedenizli.com",
      origin: "https://lilaboutiquedenizli.com",
    });
  });

  it("falls back to the platform host", () => {
    const address = storeAddress(onPlatform);
    assert.equal(address.mode, "platform");
    assert.equal(address.origin, "https://www.cortisstyle.com");
  });
});

describe("storeProductPath / Url", () => {
  it("is /urun/<x> on a custom domain and /tr/<store>/urun/<x> on the platform", () => {
    assert.equal(storeProductPath({ ...onDomain, slugOrId: "keten-gomlek" }), "/urun/keten-gomlek");
    assert.equal(
      storeProductPath({ ...onPlatform, slugOrId: "keten-gomlek" }),
      "/tr/deneme-butik/urun/keten-gomlek",
    );
  });

  it("builds the absolute URL", () => {
    assert.equal(
      storeProductUrl({ ...onDomain, slugOrId: "a" }),
      "https://lilaboutiquedenizli.com/urun/a",
    );
    assert.equal(
      storeProductUrl({ ...onPlatform, slugOrId: "a" }),
      "https://www.cortisstyle.com/tr/deneme-butik/urun/a",
    );
  });
});

describe("storeProductUrlPrefix", () => {
  it("is what the owner sees before the slug", () => {
    assert.equal(storeProductUrlPrefix(onDomain), "lilaboutiquedenizli.com/urun/");
    assert.equal(
      storeProductUrlPrefix(onPlatform),
      "www.cortisstyle.com/tr/deneme-butik/urun/",
    );
  });
});

describe("category addresses", () => {
  it("are /kategori/<slug> on a custom domain and under /tr/<store> on the platform", () => {
    assert.equal(storeCategoryPath({ ...onDomain, categorySlug: "canta" }), "/kategori/canta");
    assert.equal(
      storeCategoryPath({ ...onPlatform, categorySlug: "canta" }),
      "/tr/deneme-butik/kategori/canta",
    );
    assert.equal(
      storeCategoryUrl({ ...onDomain, categorySlug: "canta" }),
      "https://lilaboutiquedenizli.com/kategori/canta",
    );
    assert.equal(storeCategoryUrlPrefix(onDomain), "lilaboutiquedenizli.com/kategori/");
  });
});
