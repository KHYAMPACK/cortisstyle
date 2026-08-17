/** PDP “Ürün özellikleri” — AI-filled on upload, owner-editable. */

import type { TrProductFeatures } from "@/types/tr-marketplace";

export type { TrProductFeatures };

export const TR_PRODUCT_FEATURE_KEYS = [
  "gender",
  "fit",
  "color",
  "neckHem",
  "fabric",
  "composition",
] as const;

export type TrProductFeatureKey = (typeof TR_PRODUCT_FEATURE_KEYS)[number];

export const TR_PRODUCT_FEATURE_LABELS: Record<TrProductFeatureKey, string> = {
  gender: "Cinsiyet",
  fit: "Fit",
  color: "Renk",
  neckHem: "Yaka / Paça Detay",
  fabric: "Kumaş Özellik",
  composition: "Kompozisyon",
};

export const TR_PRODUCT_FEATURE_LIMITS: Record<TrProductFeatureKey, number> = {
  gender: 24,
  fit: 80,
  color: 40,
  neckHem: 80,
  fabric: 160,
  composition: 120,
};

const EMPTY: TrProductFeatures = {};

export function emptyProductFeatures(): TrProductFeatures {
  return { ...EMPTY };
}

function clampFeature(
  key: TrProductFeatureKey,
  raw: string | null | undefined,
): string {
  return (raw ?? "").replace(/\s+/g, " ").trim().slice(0, TR_PRODUCT_FEATURE_LIMITS[key]);
}

export function sanitizeProductFeatures(
  raw: unknown,
): TrProductFeatures {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return emptyProductFeatures();
  }
  const record = raw as Record<string, unknown>;
  const next: TrProductFeatures = {};
  for (const key of TR_PRODUCT_FEATURE_KEYS) {
    const value = clampFeature(
      key,
      typeof record[key] === "string" ? record[key] : null,
    );
    if (value) next[key] = value;
  }
  return next;
}

export function productFeaturesHaveValues(
  features: TrProductFeatures | null | undefined,
): boolean {
  if (!features) return false;
  return TR_PRODUCT_FEATURE_KEYS.some((key) => Boolean(features[key]?.trim()));
}

export type TrProductFeatureRow = {
  key: TrProductFeatureKey;
  label: string;
  value: string;
};

/** Rows for the PDP list. Empty fields omitted; color can fall back to picker names. */
export function listProductFeatureRows(
  features: TrProductFeatures | null | undefined,
  fallbacks?: { color?: string | null },
): TrProductFeatureRow[] {
  const merged: TrProductFeatures = { ...(features ?? {}) };
  if (!merged.color?.trim() && fallbacks?.color?.trim()) {
    merged.color = fallbacks.color.trim();
  }
  return TR_PRODUCT_FEATURE_KEYS.flatMap((key) => {
    const value = merged[key]?.trim();
    if (!value) return [];
    return [{ key, label: TR_PRODUCT_FEATURE_LABELS[key], value }];
  });
}
