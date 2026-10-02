import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addOptions, attributeBody, toggleKindOption, toggleOptionType } from "./forms";

describe("addOptions", () => {
  it("appends typed options and reports repeats", () => {
    assert.deepEqual(addOptions(["Keten"], "pamuk, keten\n Saten ,"), {
      options: ["Keten", "pamuk", "Saten"],
      skipped: ["keten"],
    });
  });
});

describe("attributeBody", () => {
  it("drops options from a text field", () => {
    assert.deepEqual(
      attributeBody({ label: "Renk", input: "text", options: ["x"], allowCustom: true }),
      { label: "Renk", input: "text", options: [], allowCustom: false },
    );
  });
});

describe("toggleOptionType", () => {
  it("keeps pick order and at most three", () => {
    assert.deepEqual(toggleOptionType(["a"], "b"), ["a", "b"]);
    assert.deepEqual(toggleOptionType(["a", "b"], "a"), ["b"]);
    assert.deepEqual(toggleOptionType(["a", "b", "c"], "d"), ["a", "b", "c"]);
  });
});

describe("toggleKindOption", () => {
  const field = { options: ["Mini", "Midi", "Maxi"] };

  it("narrows from all options, in the field's order", () => {
    const link = { attributeId: "a", required: false, options: null };
    assert.deepEqual(toggleKindOption(field, link, "Midi").options, ["Mini", "Maxi"]);
  });

  it("collapses back to all options", () => {
    const link = { attributeId: "a", required: false, options: ["Maxi", "Mini"] };
    assert.equal(toggleKindOption(field, link, "midi").options, null);
  });
});
