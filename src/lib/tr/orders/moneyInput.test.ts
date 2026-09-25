import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatLiraInput, parseLiraInput } from "@/lib/tr/orders/moneyInput";

describe("parseLiraInput", () => {
  it("reads whole lira and decimals with a comma", () => {
    assert.equal(parseLiraInput("75"), 7500);
    assert.equal(parseLiraInput("12,5"), 1250);
    assert.equal(parseLiraInput("12,50"), 1250);
    assert.equal(parseLiraInput("0,05"), 5);
    assert.equal(parseLiraInput(",5"), 50);
  });

  it("reads a dot as the decimal mark unless it groups three digits", () => {
    assert.equal(parseLiraInput("1250.50"), 125_050);
    assert.equal(parseLiraInput("12.5"), 1250);
    assert.equal(parseLiraInput("1.250"), 125_000);
    assert.equal(parseLiraInput("1.250.000"), 125_000_000);
  });

  it("reads thousands dots together with a decimal comma", () => {
    assert.equal(parseLiraInput("1.250,50"), 125_050);
    assert.equal(parseLiraInput("1,250.50"), 125_050);
  });

  it("ignores spaces and the currency sign", () => {
    assert.equal(parseLiraInput(" ₺ 75 "), 7500);
    assert.equal(parseLiraInput("75 TL"), 7500);
    assert.equal(parseLiraInput("₺1.000,00"), 100_000);
  });

  it("accepts zero", () => {
    assert.equal(parseLiraInput("0"), 0);
    assert.equal(parseLiraInput("0,00"), 0);
  });

  it("refuses text that is not an amount", () => {
    for (const text of ["", " ", "abc", "12a", "1,2,3", "12,345", "-5", ",", ".", "1e3"]) {
      assert.equal(parseLiraInput(text), null, JSON.stringify(text));
    }
  });
});

describe("formatLiraInput", () => {
  it("shows whole lira without decimals and others with two", () => {
    assert.equal(formatLiraInput(7500), "75");
    assert.equal(formatLiraInput(1250), "12,50");
    assert.equal(formatLiraInput(5), "0,05");
    assert.equal(formatLiraInput(0), "0");
  });

  it("round-trips through parseLiraInput", () => {
    for (const kurus of [0, 5, 99, 100, 1250, 125_050, 99_999_999]) {
      assert.equal(parseLiraInput(formatLiraInput(kurus)), kurus);
    }
  });
});
