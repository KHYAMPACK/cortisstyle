import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { foldForSearch } from "./searchFold";

describe("foldForSearch", () => {
  it("makes I, İ, ı and i the same letter, so case never blocks a match", () => {
    assert.equal(foldForSearch("VIP"), foldForSearch("vip"));
    assert.equal(foldForSearch("ELBISE"), foldForSearch("Elbise"));
    assert.equal(foldForSearch("İSTANBUL"), foldForSearch("istanbul"));
    assert.equal(foldForSearch("ısı"), foldForSearch("ISI"));
  });

  it("still lower-cases the other Turkish letters", () => {
    assert.equal(foldForSearch("ŞÖÇÜĞ"), "şöçüğ");
    assert.equal(foldForSearch("Ayşe Öz"), "ayşe öz");
  });

  it("leaves everything else alone", () => {
    assert.equal(foldForSearch("+90 555 111"), "+90 555 111");
    assert.equal(foldForSearch(""), "");
  });
});
