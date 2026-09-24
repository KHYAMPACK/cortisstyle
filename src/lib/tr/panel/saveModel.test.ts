import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSaveShortcut } from "./saveModel";

const base = {
  key: "s",
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
};

describe("isSaveShortcut", () => {
  it("matches Ctrl+S and Cmd+S, either case", () => {
    assert.equal(isSaveShortcut({ ...base, ctrlKey: true }), true);
    assert.equal(isSaveShortcut({ ...base, metaKey: true }), true);
    assert.equal(isSaveShortcut({ ...base, ctrlKey: true, key: "S" }), true);
  });

  it("ignores a bare S and other shortcuts", () => {
    assert.equal(isSaveShortcut(base), false);
    assert.equal(isSaveShortcut({ ...base, ctrlKey: true, key: "a" }), false);
    assert.equal(isSaveShortcut({ ...base, ctrlKey: true, shiftKey: true }), false);
    assert.equal(isSaveShortcut({ ...base, ctrlKey: true, altKey: true }), false);
  });
});
