import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LILA_STUDIO_BACK_PATH, LILA_STUDIO_THREE_QUARTER_PATH } from "./prompts";
import {
  getAiModelOptionById,
  getElbiseTryOnPlates,
  housePhotographyStyleRefs,
  LILA_HOUSE_MODEL_ID,
  LILABUTIK_LILA_TRYON_REFS_BY_STYLE,
  modelHasPhotographyStyles,
  parseHousePhotographyStyle,
} from "./registry";

describe("house model photography styles", () => {
  it("keeps Lila's stored id and her blinds / flash plates", () => {
    assert.equal(LILA_HOUSE_MODEL_ID, "boutique:lilabutik");
    assert.equal(modelHasPhotographyStyles(LILA_HOUSE_MODEL_ID), true);
    assert.deepEqual(
      housePhotographyStyleRefs(LILA_HOUSE_MODEL_ID),
      LILABUTIK_LILA_TRYON_REFS_BY_STYLE,
    );
    assert.match(
      getAiModelOptionById(LILA_HOUSE_MODEL_ID)?.hint ?? "",
      /stil seçin/,
    );
  });

  it("has no styles for studio models, unknown ids or a bare slug", () => {
    for (const id of ["studio:ayla", "studio:deniz", "boutique:deneme-butik", "lilabutik", "", null]) {
      assert.equal(modelHasPhotographyStyles(id), false, String(id));
    }
  });

  it("reads a style, defaulting to blinds", () => {
    assert.equal(parseHousePhotographyStyle("flash"), "flash");
    assert.equal(parseHousePhotographyStyle("blinds"), "blinds");
    assert.equal(parseHousePhotographyStyle(undefined), "blinds");
    assert.equal(parseHousePhotographyStyle("other"), "blinds");
  });
});

describe("getElbiseTryOnPlates", () => {
  it("pins Lila's grey-studio plates", () => {
    assert.deepEqual(getElbiseTryOnPlates(LILA_HOUSE_MODEL_ID), {
      threeQuarter: LILA_STUDIO_THREE_QUARTER_PATH,
      back: LILA_STUDIO_BACK_PATH,
    });
  });

  it("keeps the studio models' own plates", () => {
    assert.ok(getElbiseTryOnPlates("studio:ayla")?.back);
    assert.equal(getElbiseTryOnPlates("boutique:unknown"), null);
  });
});
