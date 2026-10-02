import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeProductFeatures } from "@/lib/tr/catalog/productFeatures";
import {
  choiceChips,
  missingRequiredField,
  readFeatureValue,
  withFeatureValue,
} from "./featureValues";

describe("feature values", () => {
  it("reads and writes built-in and store-defined fields alike", () => {
    const features = withFeatureValue({ fabric: "Keten" }, "astar", "Var");
    assert.equal(readFeatureValue(features, "fabric"), "Keten");
    assert.equal(readFeatureValue(features, "astar"), "Var");
    assert.deepEqual(withFeatureValue(features, "astar", " "), { fabric: "Keten" });
  });

  it("keeps a stored value that isn't one of the options as a chip", () => {
    assert.deepEqual(choiceChips(["Keten", "Pamuk"], "Hafif dokuma"), [
      "Keten",
      "Pamuk",
      "Hafif dokuma",
    ]);
    assert.deepEqual(choiceChips(["Keten", "Pamuk"], "keten"), ["Keten", "Pamuk"]);
  });
});

describe("sanitizeProductFeatures and store-defined fields", () => {
  it("keeps a store's own field values next to the built-in ones", () => {
    const clean = sanitizeProductFeatures({
      fabric: "Keten",
      astar: "  Var ",
      bakimNotu: "30°C\nelde yıkama",
      manualListing: true,
    });
    assert.equal((clean as Record<string, unknown>).astar, "Var");
    assert.equal((clean as Record<string, unknown>).bakimNotu, "30°C\nelde yıkama");
    assert.equal(clean.fabric, "Keten");
    assert.equal(clean.manualListing, true);
  });

  it("drops what isn't a field value", () => {
    const clean = sanitizeProductFeatures({
      "Bad Key": "x",
      _private: "x",
      count: 3,
      empty: "  ",
      uploadKind: "other",
    }) as Record<string, unknown>;
    assert.deepEqual(Object.keys(clean), []);
  });
});

describe("missingRequiredField", () => {
  it("names the first empty required field of the kind", () => {
    const kind = {
      attributes: [
        { attributeId: "a1", required: false, options: null },
        { attributeId: "a2", required: true, options: null },
      ],
    };
    const fields = [
      { id: "a1", key: "fabric", label: "Kumaş" },
      { id: "a2", key: "astar", label: "Astar" },
    ];
    assert.equal(missingRequiredField(kind, fields, {}), "“Astar” zorunlu.");
    assert.equal(missingRequiredField(kind, fields, { astar: "Var" } as never), null);
    assert.equal(missingRequiredField(null, fields, {}), null);
  });
});
