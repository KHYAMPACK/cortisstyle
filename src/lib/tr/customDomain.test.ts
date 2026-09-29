import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import {
  isCanonicalRedirectExemptPath,
  normalizeBoutiqueHost,
  parsePlatformBoutiquePath,
  resolveSlugFromStoresSubdomain,
  subdomainSlugOf,
} from "./customDomain";

// Captured before any test runs (module load is synchronous), restored once at the end.
// Each test below sets whatever value it needs itself rather than relying on shared setup,
// so these stay correct regardless of test execution order.
const ORIGINAL_STORES_DOMAIN = process.env.TR_STORES_DOMAIN;
after(() => {
  if (ORIGINAL_STORES_DOMAIN === undefined) delete process.env.TR_STORES_DOMAIN;
  else process.env.TR_STORES_DOMAIN = ORIGINAL_STORES_DOMAIN;
});

describe("normalizeBoutiqueHost", () => {
  it("lowercases and strips a port", () => {
    assert.equal(normalizeBoutiqueHost("  Lilabutik.COM:3000 "), "lilabutik.com");
  });
});

describe("subdomainSlugOf", () => {
  it("reads the slug off <slug>.<storesDomain>", () => {
    assert.equal(subdomainSlugOf("lilabutik.corti.store", "corti.store"), "lilabutik");
  });

  it("is case-insensitive and ignores a port", () => {
    assert.equal(subdomainSlugOf("LILABUTIK.Corti.Store:443", "corti.store"), "lilabutik");
  });

  it("is null when there is no stores domain configured", () => {
    assert.equal(subdomainSlugOf("lilabutik.corti.store", null), null);
  });

  it("is null when the host is not under the stores domain", () => {
    assert.equal(subdomainSlugOf("lilabutik.example.com", "corti.store"), null);
    // Not even a suffix match on the label itself.
    assert.equal(subdomainSlugOf("lilabutikcorti.store", "corti.store"), null);
  });

  it("is null for the bare stores domain (not a store)", () => {
    assert.equal(subdomainSlugOf("corti.store", "corti.store"), null);
  });

  it("is null for a deeper subdomain (two labels)", () => {
    assert.equal(subdomainSlugOf("a.b.corti.store", "corti.store"), null);
  });

  it("rejects reserved labels", () => {
    for (const label of ["www", "api", "cdn", "admin", "panel"]) {
      assert.equal(subdomainSlugOf(`${label}.corti.store`, "corti.store"), null, label);
    }
  });

  it("does not reject a slug that merely contains a reserved word", () => {
    assert.equal(subdomainSlugOf("mywwwstore.corti.store", "corti.store"), "mywwwstore");
  });
});

describe("resolveSlugFromStoresSubdomain", () => {
  it("reads TR_STORES_DOMAIN", () => {
    process.env.TR_STORES_DOMAIN = "corti.store";
    assert.equal(resolveSlugFromStoresSubdomain("lilabutik.corti.store"), "lilabutik");
    assert.equal(resolveSlugFromStoresSubdomain("lilabutik.example.com"), null);
  });

  it("trims a leading dot and normalizes case from the env value", () => {
    process.env.TR_STORES_DOMAIN = " .Corti.Store ";
    assert.equal(resolveSlugFromStoresSubdomain("lilabutik.corti.store"), "lilabutik");
  });

  it("is null (not thrown) when the env var is unset or malformed", () => {
    delete process.env.TR_STORES_DOMAIN;
    assert.equal(resolveSlugFromStoresSubdomain("lilabutik.corti.store"), null);

    process.env.TR_STORES_DOMAIN = "not-a-domain";
    assert.equal(resolveSlugFromStoresSubdomain("lilabutik.corti.store"), null);

    process.env.TR_STORES_DOMAIN = "   ";
    assert.equal(resolveSlugFromStoresSubdomain("lilabutik.corti.store"), null);
  });
});

describe("isCanonicalRedirectExemptPath", () => {
  it("exempts framework internals, auth, well-known and the owner panel", () => {
    for (const pathname of [
      "/_next/static/chunk.js",
      "/api/tr/owner/orders",
      "/auth/callback",
      "/.well-known/apple-app-site-association",
      "/tr/panel",
      "/tr/panel/siparisler",
    ]) {
      assert.equal(isCanonicalRedirectExemptPath(pathname), true, pathname);
    }
  });

  it("does not exempt origin SEO files or static assets — those redirect too", () => {
    for (const pathname of ["/sitemap.xml", "/robots.txt", "/favicon.ico", "/urun/a"]) {
      assert.equal(isCanonicalRedirectExemptPath(pathname), false, pathname);
    }
  });

  it("does not exempt a boutique's own /tr/<slug> path, only /tr/panel", () => {
    assert.equal(isCanonicalRedirectExemptPath("/tr/lilabutik"), false);
    assert.equal(isCanonicalRedirectExemptPath("/tr/panelli-butik"), false);
  });
});

describe("parsePlatformBoutiquePath", () => {
  it("reads the slug and clean path off /tr/<slug>/…", () => {
    assert.deepEqual(parsePlatformBoutiquePath("/tr/deneme-butik/urun/a"), {
      slug: "deneme-butik",
      cleanPath: "/urun/a",
    });
  });

  it("is the boutique home (clean path '/') for the bare /tr/<slug>", () => {
    assert.deepEqual(parsePlatformBoutiquePath("/tr/deneme-butik"), {
      slug: "deneme-butik",
      cleanPath: "/",
    });
    assert.deepEqual(parsePlatformBoutiquePath("/tr/deneme-butik/"), {
      slug: "deneme-butik",
      cleanPath: "/",
    });
  });

  it("decodes a percent-encoded slug", () => {
    assert.deepEqual(parsePlatformBoutiquePath("/tr/deneme%20butik"), {
      slug: "deneme butik",
      cleanPath: "/",
    });
  });

  it("is null for anything that isn't /tr/<something>", () => {
    for (const pathname of ["/", "/privacy", "/tr", "/tr/", "/urun/a"]) {
      assert.equal(parsePlatformBoutiquePath(pathname), null, pathname);
    }
  });

  it("is null (not thrown) on a malformed percent-encoding", () => {
    assert.equal(parsePlatformBoutiquePath("/tr/%zz"), null);
  });

  it("does not itself treat /tr/panel as special — the caller checks that first", () => {
    assert.deepEqual(parsePlatformBoutiquePath("/tr/panel/siparisler"), {
      slug: "panel",
      cleanPath: "/siparisler",
    });
  });
});
