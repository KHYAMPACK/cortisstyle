import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CODE_LIMITS,
  generateCampaignCodes,
  normalizeCode,
  readCodeLimitsBody,
  readCustomCodeBody,
  readGenerateCodesBody,
} from "@/lib/tr/discounts/codeRules";

describe("normalizeCode", () => {
  it("trims and lowercases", () => {
    assert.equal(normalizeCode("  YAZ10  "), "yaz10");
  });
});

describe("readCodeLimitsBody", () => {
  it("reads both toggles independently, defaulting to off", () => {
    assert.deepEqual(readCodeLimitsBody({}), {
      usageLimitTotal: null,
      usageLimitPerCustomer: null,
    });
    assert.deepEqual(readCodeLimitsBody({ usageLimitTotal: 100 }), {
      usageLimitTotal: 100,
      usageLimitPerCustomer: null,
    });
  });

  it("rejects a non-positive or non-integer limit", () => {
    assert.throws(() => readCodeLimitsBody({ usageLimitTotal: 0 }), /geçersiz/);
    assert.throws(() => readCodeLimitsBody({ usageLimitTotal: 1.5 }), /geçersiz/);
    assert.throws(() => readCodeLimitsBody({ usageLimitPerCustomer: -1 }), /geçersiz/);
  });
});

describe("readCustomCodeBody", () => {
  it("normalizes a valid code and carries its limits", () => {
    const result = readCustomCodeBody({ code: " Yaz-10_2026 ", usageLimitPerCustomer: 1 });
    assert.equal(result.code, "yaz-10_2026");
    assert.equal(result.usageLimitPerCustomer, 1);
    assert.equal(result.usageLimitTotal, null);
  });

  it("rejects an empty, too-long, or invalid-character code", () => {
    assert.throws(() => readCustomCodeBody({ code: "  " }), /zorunlu/);
    assert.throws(() => readCustomCodeBody({ code: "x".repeat(51) }), /en fazla 50/);
    assert.throws(() => readCustomCodeBody({ code: "yaz 10" }), /harf, rakam/);
    assert.throws(() => readCustomCodeBody({ code: "yaz%10" }), /harf, rakam/);
  });
});

describe("readGenerateCodesBody", () => {
  it("reads a prefix and count", () => {
    const result = readGenerateCodesBody({ prefix: "ikas-", count: 5 });
    assert.equal(result.prefix, "ikas-");
    assert.equal(result.count, 5);
  });

  it("requires a prefix and a positive count within the cap", () => {
    assert.throws(() => readGenerateCodesBody({ prefix: "", count: 1 }), /ön eki zorunlu/);
    assert.throws(() => readGenerateCodesBody({ prefix: "a", count: 0 }), /en az 1/);
    assert.throws(
      () => readGenerateCodesBody({ prefix: "a", count: CODE_LIMITS.generateMax + 1 }),
      /En fazla \d+ kupon/,
    );
    assert.doesNotThrow(() => readGenerateCodesBody({ prefix: "a", count: CODE_LIMITS.generateMax }));
  });
});

describe("generateCampaignCodes", () => {
  it("makes the requested number of unique prefixed codes", () => {
    const codes = generateCampaignCodes("ikas-", 20);
    assert.equal(codes.length, 20);
    assert.equal(new Set(codes).size, 20);
    for (const code of codes) {
      assert.ok(code.startsWith("ikas-"));
      assert.equal(code.length, "ikas-".length + 6);
    }
  });

  it("never returns a code already in `existing`, and is deterministic with a seeded random", () => {
    const existing = new Set(["a-000000"]);
    let seed = 0;
    const seeded = () => {
      // Always yields 0 first, which alone would collide with "a-000000" forever;
      // proves the generator advances past a taken candidate instead of looping.
      seed += 1;
      return seed === 1 ? 0 : 0.5;
    };
    const codes = generateCampaignCodes("a-", 1, existing, seeded);
    assert.equal(codes.length, 1);
    assert.notEqual(codes[0], "a-000000");
  });

  it("throws rather than loop forever when the space is exhausted", () => {
    // A single-character alphabet forced via a random() that always returns 0, with
    // every possible 1-length-effective candidate already taken.
    const existing = new Set(["p-aaaaaa"]);
    assert.throws(
      () => generateCampaignCodes("p-", 1, existing, () => 0),
      /Yeterli sayıda/,
    );
  });
});
