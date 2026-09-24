import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { activeSectionIndex } from "./editorScrollSpy";

describe("activeSectionIndex", () => {
  it("starts on the first tab while every section is still below the bars", () => {
    assert.equal(activeSectionIndex([300, 900, 1500], 128, false), 0);
  });

  it("moves to a section once its top reaches the offset", () => {
    assert.equal(activeSectionIndex([-600, 100, 700], 128, false), 1);
    assert.equal(activeSectionIndex([-1200, -400, 120], 128, false), 2);
  });

  it("picks the last tab at the bottom of the page", () => {
    assert.equal(activeSectionIndex([-900, -300, 400], 128, true), 2);
  });

  it("copes with no tabs", () => {
    assert.equal(activeSectionIndex([], 128, false), 0);
  });
});
