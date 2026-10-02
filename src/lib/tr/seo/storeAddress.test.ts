import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canonicalStoreHost,
  resolveCanonicalRedirect,
  resolveStoreHostKind,
  storeAddress,
  storeCategoryPath,
  storeCategoryUrl,
  storeCategoryUrlPrefix,
  storeProductPath,
  storeProductUrl,
  storeProductUrlPrefix,
  type StoreHostKind,
} from "./storeAddress";

const onDomain = { boutiqueSlug: "lilabutik", customDomain: "lilaboutiquedenizli.com" };
const onPlatform = { boutiqueSlug: "deneme-butik", customDomain: null };

describe("storeAddress", () => {
  it("uses the custom domain as stored, www. included", () => {
    assert.deepEqual(storeAddress({ ...onDomain, customDomain: "WWW.Lilaboutiquedenizli.com" }), {
      mode: "boutique-domain",
      host: "www.lilaboutiquedenizli.com",
      origin: "https://www.lilaboutiquedenizli.com",
    });
    assert.equal(storeAddress(onDomain).origin, "https://lilaboutiquedenizli.com");
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

describe("resolveStoreHostKind", () => {
  const base = { host: "", storesDomain: "corti.store", customDomainSlug: null };

  it("is custom-domain when the custom-domain lookup already matched, apex or www", () => {
    assert.deepEqual(
      resolveStoreHostKind({ ...base, host: "lilaboutiquedenizli.com", customDomainSlug: "lilabutik" }),
      { kind: "custom-domain", slug: "lilabutik", hostWasWww: false },
    );
    assert.deepEqual(
      resolveStoreHostKind({
        ...base,
        host: "WWW.lilaboutiquedenizli.com",
        customDomainSlug: "lilabutik",
      }),
      { kind: "custom-domain", slug: "lilabutik", hostWasWww: true },
    );
  });

  it("is subdomain when the host matches <slug>.<storesDomain> and no custom domain matched", () => {
    assert.deepEqual(resolveStoreHostKind({ ...base, host: "lilabutik.corti.store" }), {
      kind: "subdomain",
      slug: "lilabutik",
    });
  });

  it("prefers the custom-domain match over a coincidental subdomain-shaped host", () => {
    assert.deepEqual(
      resolveStoreHostKind({
        ...base,
        host: "lilabutik.corti.store",
        customDomainSlug: "someone-else",
      }),
      { kind: "custom-domain", slug: "someone-else", hostWasWww: false },
    );
  });

  it("falls back to platform for anything else, including www.cortisstyle.com", () => {
    assert.deepEqual(resolveStoreHostKind({ ...base, host: "www.cortisstyle.com" }), {
      kind: "platform",
    });
  });
});

describe("canonicalStoreHost", () => {
  it("prefers the custom domain, as stored (www. included)", () => {
    assert.equal(
      canonicalStoreHost({
        slug: "lilabutik",
        customDomain: "WWW.Lilaboutiquedenizli.com",
        storesDomain: "corti.store",
      }),
      "www.lilaboutiquedenizli.com",
    );
  });

  it("falls back to the subdomain without a custom domain", () => {
    assert.equal(
      canonicalStoreHost({ slug: "deneme-butik", customDomain: null, storesDomain: "corti.store" }),
      "deneme-butik.corti.store",
    );
  });

  it("is null when neither exists yet — nothing canonical to send anyone to", () => {
    assert.equal(
      canonicalStoreHost({ slug: "deneme-butik", customDomain: null, storesDomain: null }),
      null,
    );
  });
});

describe("resolveCanonicalRedirect", () => {
  const platform: StoreHostKind = { kind: "platform" };
  const subdomain: StoreHostKind = { kind: "subdomain", slug: "deneme-butik" };
  const customDomainApex: StoreHostKind = {
    kind: "custom-domain",
    slug: "lilabutik",
    hostWasWww: false,
  };
  const customDomainWww: StoreHostKind = {
    kind: "custom-domain",
    slug: "lilabutik",
    hostWasWww: true,
  };

  it("sends a platform-host request to the subdomain when there is no custom domain", () => {
    assert.deepEqual(
      resolveCanonicalRedirect({
        hostKind: platform,
        cleanPath: "/urun/a",
        slug: "deneme-butik",
        customDomain: null,
        storesDomain: "corti.store",
      }),
      { host: "deneme-butik.corti.store", path: "/urun/a" },
    );
  });

  it("sends a platform-host request straight to the custom domain when one exists", () => {
    assert.deepEqual(
      resolveCanonicalRedirect({
        hostKind: platform,
        cleanPath: "/urun/a",
        slug: "lilabutik",
        customDomain: "lilaboutiquedenizli.com",
        storesDomain: "corti.store",
      }),
      { host: "lilaboutiquedenizli.com", path: "/urun/a" },
    );
  });

  it("does not redirect a platform-host request when nothing canonical exists yet", () => {
    assert.equal(
      resolveCanonicalRedirect({
        hostKind: platform,
        cleanPath: "/urun/a",
        slug: "deneme-butik",
        customDomain: null,
        storesDomain: null,
      }),
      null,
    );
  });

  it("sends the subdomain to the custom domain once one is connected", () => {
    assert.deepEqual(
      resolveCanonicalRedirect({
        hostKind: subdomain,
        cleanPath: "/urunler",
        slug: "deneme-butik",
        customDomain: "deneme-butik.com",
        storesDomain: "corti.store",
      }),
      { host: "deneme-butik.com", path: "/urunler" },
    );
  });

  it("keeps the subdomain canonical without a custom domain", () => {
    assert.equal(
      resolveCanonicalRedirect({
        hostKind: subdomain,
        cleanPath: "/urunler",
        slug: "deneme-butik",
        customDomain: null,
        storesDomain: "corti.store",
      }),
      null,
    );
  });

  it("does not redirect www.<custom domain> — the hosting decides apex vs www (a redirect here looped)", () => {
    assert.equal(
      resolveCanonicalRedirect({
        hostKind: customDomainWww,
        cleanPath: "/",
        slug: "lilabutik",
        customDomain: "lilaboutiquedenizli.com",
        storesDomain: "corti.store",
      }),
      null,
    );
  });

  it("does not redirect the apex custom domain — it is already canonical", () => {
    assert.equal(
      resolveCanonicalRedirect({
        hostKind: customDomainApex,
        cleanPath: "/",
        slug: "lilabutik",
        customDomain: "lilaboutiquedenizli.com",
        storesDomain: "corti.store",
      }),
      null,
    );
  });
});
