import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatTryFromKurus } from "./tr-marketplace";

describe("formatTryFromKurus", () => {
  it("keeps whole-lira prices without decimals, as before", () => {
    assert.equal(formatTryFromKurus(350_000), "₺3.500");
    assert.equal(formatTryFromKurus(12_000), "₺120");
    assert.equal(formatTryFromKurus(0), "₺0");
  });

  it("shows kuruş when there is a non-zero remainder", () => {
    assert.equal(formatTryFromKurus(8_990), "₺89,90");
    assert.equal(formatTryFromKurus(158_990), "₺1.589,90");
    assert.equal(formatTryFromKurus(5), "₺0,05");
  });
});
