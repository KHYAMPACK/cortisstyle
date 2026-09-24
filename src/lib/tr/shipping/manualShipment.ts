/**
 * Hand-entered shipment details for boutiques that ship with their own carrier
 * (no carrier integration): the carrier's name and, if they have one, the
 * tracking code. Pure so the rules are tested and the form and API agree.
 */

export const CARRIER_NAME_MAX = 60;
export const TRACKING_CODE_MAX = 80;

/** Turkish carriers boutiques usually ship with — quick picks in the form. */
export const COMMON_CARRIERS: readonly string[] = [
  "Yurtiçi Kargo",
  "Aras Kargo",
  "MNG Kargo",
  "PTT Kargo",
  "Sürat Kargo",
  "HepsiJet",
  "UPS",
];

export type ManualShipmentInput = {
  carrierName: unknown;
  trackingCode: unknown;
};

export type ManualShipmentResult =
  | { ok: true; carrierName: string; trackingCode: string | null }
  | { ok: false; error: string };

function clean(value: unknown): string {
  // Collapse whitespace and drop control characters pasted in from other apps.
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()
    : "";
}

export function validateManualShipment(
  input: ManualShipmentInput,
): ManualShipmentResult {
  const carrierName = clean(input.carrierName);
  const trackingCode = clean(input.trackingCode);

  if (!carrierName) return { ok: false, error: "Kargo firmasını yazın." };
  if (carrierName.length > CARRIER_NAME_MAX) {
    return {
      ok: false,
      error: `Kargo firması en fazla ${CARRIER_NAME_MAX} karakter olabilir.`,
    };
  }
  if (trackingCode.length > TRACKING_CODE_MAX) {
    return {
      ok: false,
      error: `Takip numarası en fazla ${TRACKING_CODE_MAX} karakter olabilir.`,
    };
  }
  return { ok: true, carrierName, trackingCode: trackingCode || null };
}
