import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSeoEmpty,
  isValidCanonicalPath,
  normalizeCanonicalInput,
  sanitizeSeo,
  SEO_LIMITS,
} from "./seoFields";

describe("sanitizeSeo", () => {
  it("keeps the four known fields, trimmed", () => {
    assert.deepEqual(
      sanitizeSeo({
        title: "  Keten Gömlek  ",
        description: " Yazlık ",
        noindex: true,
        canonical: "/urun/keten-gomlek",
        extra: "dropped",
      }),
      {
        title: "Keten Gömlek",
        description: "Yazlık",
        noindex: true,
        canonical: "/urun/keten-gomlek",
      },
    );
  });

  it("drops empty values and anything that is not an object", () => {
    assert.deepEqual(sanitizeSeo({ title: " ", noindex: false }), {});
    assert.deepEqual(sanitizeSeo(null), {});
    assert.deepEqual(sanitizeSeo("x"), {});
    assert.equal(isSeoEmpty(sanitizeSeo(undefined)), true);
  });

  it("clamps title and description to their limits", () => {
    const seo = sanitizeSeo({
      title: "t".repeat(SEO_LIMITS.title + 50),
      description: "d".repeat(SEO_LIMITS.description + 50),
    });
    assert.equal(seo.title?.length, SEO_LIMITS.title);
    assert.equal(seo.description?.length, SEO_LIMITS.description);
  });

  it("only accepts a canonical path on the store's own address", () => {
    assert.equal(sanitizeSeo({ canonical: "https://evil.example/x" }).canonical, undefined);
    assert.equal(sanitizeSeo({ canonical: "//evil.example/x" }).canonical, undefined);
    assert.equal(sanitizeSeo({ canonical: "/a b" }).canonical, undefined);
    assert.equal(sanitizeSeo({ canonical: "/" }).canonical, undefined);
    assert.equal(sanitizeSeo({ canonical: "/urun/a" }).canonical, "/urun/a");
  });
});

describe("canonical input", () => {
  it("strips the slashes and spaces an owner types after the fixed prefix", () => {
    assert.equal(normalizeCanonicalInput("/urun/a b"), "urun/ab");
    assert.equal(normalizeCanonicalInput("//x"), "x");
  });

  it("validates finished paths", () => {
    assert.equal(isValidCanonicalPath("/urun/a"), true);
    assert.equal(isValidCanonicalPath("urun/a"), false);
  });
});
