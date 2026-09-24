import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CARRIER_NAME_MAX,
  TRACKING_CODE_MAX,
  validateManualShipment,
} from "./manualShipment";

describe("validateManualShipment", () => {
  it("accepts a carrier with a tracking code", () => {
    assert.deepEqual(
      validateManualShipment({ carrierName: "Yurtiçi Kargo", trackingCode: "1234567890" }),
      { ok: true, carrierName: "Yurtiçi Kargo", trackingCode: "1234567890" },
    );
  });

  it("treats the tracking code as optional", () => {
    assert.deepEqual(validateManualShipment({ carrierName: "Aras Kargo", trackingCode: "  " }), {
      ok: true,
      carrierName: "Aras Kargo",
      trackingCode: null,
    });
    assert.deepEqual(validateManualShipment({ carrierName: "Aras Kargo", trackingCode: undefined }), {
      ok: true,
      carrierName: "Aras Kargo",
      trackingCode: null,
    });
  });

  it("requires a carrier name", () => {
    for (const carrierName of ["", "   ", undefined, null, 5]) {
      const result = validateManualShipment({ carrierName, trackingCode: "1" });
      assert.equal(result.ok, false);
    }
  });

  it("tidies whitespace and pasted control characters", () => {
    assert.deepEqual(
      validateManualShipment({ carrierName: "  MNG\u0009  Kargo ", trackingCode: "AB 12\n34" }),
      { ok: true, carrierName: "MNG Kargo", trackingCode: "AB 12 34" },
    );
  });

  it("enforces length limits after tidying", () => {
    assert.equal(
      validateManualShipment({ carrierName: "x".repeat(CARRIER_NAME_MAX + 1), trackingCode: "" }).ok,
      false,
    );
    assert.equal(
      validateManualShipment({ carrierName: "x".repeat(CARRIER_NAME_MAX), trackingCode: "y".repeat(TRACKING_CODE_MAX) }).ok,
      true,
    );
    assert.equal(
      validateManualShipment({ carrierName: "Aras", trackingCode: "y".repeat(TRACKING_CODE_MAX + 1) }).ok,
      false,
    );
  });
});
