import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateUniqueSlug,
  isValidSlug,
  looksLikeUuid,
  sanitizeSlugInput,
  SLUG_MAX_LENGTH,
  slugify,
  slugWithSuffix,
} from "./slug";

describe("slugify", () => {
  it("folds Turkish letters and punctuation", () => {
    assert.equal(slugify("Keten Gömlek Elbise"), "keten-gomlek-elbise");
    assert.equal(slugify("ÇİĞ KÖFTE, ŞÜKRÜ & IŞIK!"), "cig-kofte-sukru-isik");
    assert.equal(slugify("  Deri   Cüzdan (Siyah) "), "deri-cuzdan-siyah");
  });

  it("drops other accents and gives an empty string for nothing usable", () => {
    assert.equal(slugify("Café crème"), "cafe-creme");
    assert.equal(slugify("!!!"), "");
    assert.equal(slugify(""), "");
  });

  it("stays within the length limit without a trailing hyphen", () => {
    const long = slugify("a ".repeat(400));
    assert.ok(long.length <= SLUG_MAX_LENGTH);
    assert.ok(!long.endsWith("-"));
  });
});

describe("sanitizeSlugInput", () => {
  it("keeps a trailing hyphen while typing but not a leading one", () => {
    assert.equal(sanitizeSlugInput("keten-"), "keten-");
    assert.equal(sanitizeSlugInput("-keten"), "keten");
    assert.equal(sanitizeSlugInput("Keten Gömlek"), "keten-gomlek");
  });
});

describe("isValidSlug", () => {
  it("accepts lowercase words joined by single hyphens", () => {
    assert.equal(isValidSlug("keten-gomlek-2"), true);
    assert.equal(isValidSlug("a"), true);
  });

  it("rejects everything else, including anything shaped like an id", () => {
    for (const bad of ["", "-a", "a-", "a--b", "A-b", "a b", "a_b", "ç"]) {
      assert.equal(isValidSlug(bad), false, bad);
    }
    assert.equal(isValidSlug("3f2b8c1e-5d4a-4b6e-9f10-2a7c9d8e1b34"), false);
    assert.equal(isValidSlug("a".repeat(SLUG_MAX_LENGTH + 1)), false);
  });
});

describe("looksLikeUuid", () => {
  it("recognises product ids", () => {
    assert.equal(looksLikeUuid("3f2b8c1e-5d4a-4b6e-9f10-2a7c9d8e1b34"), true);
    assert.equal(looksLikeUuid("keten-gomlek"), false);
  });
});

describe("slugWithSuffix", () => {
  it("adds -2, -3 … and respects the limit", () => {
    assert.equal(slugWithSuffix("deri", 1), "deri");
    assert.equal(slugWithSuffix("deri", 2), "deri-2");
    const capped = slugWithSuffix("a".repeat(SLUG_MAX_LENGTH), 12);
    assert.ok(capped.length <= SLUG_MAX_LENGTH);
    assert.ok(capped.endsWith("-12"));
  });
});

describe("generateUniqueSlug", () => {
  it("returns the base when it is free", async () => {
    assert.equal(await generateUniqueSlug("deri", async () => false), "deri");
  });

  it("walks -2, -3 until one is free", async () => {
    const taken = new Set(["deri", "deri-2"]);
    assert.equal(
      await generateUniqueSlug("deri", async (candidate) => taken.has(candidate)),
      "deri-3",
    );
  });

  it("falls back to 'urun' for an empty base and never uses an id-shaped one", async () => {
    assert.equal(await generateUniqueSlug("", async () => false), "urun");
    assert.equal(
      await generateUniqueSlug(
        "3f2b8c1e-5d4a-4b6e-9f10-2a7c9d8e1b34",
        async () => false,
      ),
      "urun",
    );
  });

  it("gives up after the attempt budget", async () => {
    await assert.rejects(
      generateUniqueSlug("deri", async () => true, 3),
      /slug/i,
    );
  });
});
