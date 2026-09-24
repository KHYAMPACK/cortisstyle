/**
 * Validation for a boutique's shipping fee settings, shared by the owner API and
 * the admin seed route. The DB has matching CHECK constraints as a backstop
 * (supabase/patch_tr_boutiques_shipping_settings.sql).
 */

export const MAX_SHIPPING_FEE_KURUS = 100_000;
export const MAX_FREE_SHIPPING_MIN_ITEMS = 100;
export const MIN_FREE_SHIPPING_SUBTOTAL_KURUS = 100;
export const MAX_FREE_SHIPPING_SUBTOTAL_KURUS = 100_000_000;

/** `undefined` = leave unchanged, `null` = clear. */
export interface ShippingSettingsValue {
  shippingFeeKurus?: number;
  freeShippingMinItems?: number | null;
  freeShippingMinSubtotalKurus?: number | null;
}

export type ShippingSettingsResult =
  | { ok: true; value: ShippingSettingsValue }
  | { ok: false; error: string };

function readInteger(
  raw: unknown,
  label: string,
  min: number,
  max: number,
): { ok: true; value: number } | { ok: false; error: string } {
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    return { ok: false, error: `${label} tam sayı olmalı.` };
  }
  if (raw < min || raw > max) {
    return { ok: false, error: `${label} ${min} ile ${max} arasında olmalı.` };
  }
  return { ok: true, value: raw };
}

export function validateShippingSettings(input: {
  shippingFeeKurus?: unknown;
  freeShippingMinItems?: unknown;
  freeShippingMinSubtotalKurus?: unknown;
}): ShippingSettingsResult {
  const value: ShippingSettingsValue = {};

  if (input.shippingFeeKurus !== undefined) {
    const fee = readInteger(
      input.shippingFeeKurus,
      "Kargo ücreti (kuruş)",
      0,
      MAX_SHIPPING_FEE_KURUS,
    );
    if (!fee.ok) return fee;
    value.shippingFeeKurus = fee.value;
  }

  if (input.freeShippingMinItems !== undefined) {
    if (input.freeShippingMinItems === null) {
      value.freeShippingMinItems = null;
    } else {
      const items = readInteger(
        input.freeShippingMinItems,
        "Ücretsiz kargo ürün adedi",
        1,
        MAX_FREE_SHIPPING_MIN_ITEMS,
      );
      if (!items.ok) return items;
      value.freeShippingMinItems = items.value;
    }
  }

  if (input.freeShippingMinSubtotalKurus !== undefined) {
    if (input.freeShippingMinSubtotalKurus === null) {
      value.freeShippingMinSubtotalKurus = null;
    } else {
      const amount = readInteger(
        input.freeShippingMinSubtotalKurus,
        "Ücretsiz kargo tutarı (kuruş)",
        MIN_FREE_SHIPPING_SUBTOTAL_KURUS,
        MAX_FREE_SHIPPING_SUBTOTAL_KURUS,
      );
      if (!amount.ok) return amount;
      value.freeShippingMinSubtotalKurus = amount.value;
    }
  }

  const setsItems =
    value.freeShippingMinItems !== undefined && value.freeShippingMinItems !== null;
  const setsAmount =
    value.freeShippingMinSubtotalKurus !== undefined &&
    value.freeShippingMinSubtotalKurus !== null;
  if (setsItems && setsAmount) {
    return {
      ok: false,
      error:
        "Ücretsiz kargo için ürün adedi veya tutar eşiklerinden yalnızca biri girilebilir.",
    };
  }
  // Only one threshold can exist, so setting one clears the other.
  if (setsItems && value.freeShippingMinSubtotalKurus === undefined) {
    value.freeShippingMinSubtotalKurus = null;
  }
  if (setsAmount && value.freeShippingMinItems === undefined) {
    value.freeShippingMinItems = null;
  }

  return { ok: true, value };
}

/** Intake / seed payloads use whole or decimal lira; store integer kuruş. */
export function liraToKurus(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return Math.round(value * 100);
}
