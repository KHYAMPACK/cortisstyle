/** PDP “Ürün özellikleri” — AI-filled on upload, owner-editable. */

import type { TrProductFeatures } from "@/types/tr-marketplace";
import {
  resolveDressFeatureValue,
  type DressFeatureKey,
} from "@/lib/tr/catalog/dressFeatures";

export type { TrProductFeatures };

export const TR_PRODUCT_FEATURE_KEYS = [
  "gender",
  "fit",
  "color",
  "neckHem",
  "neckline",
  "sleeves",
  "length",
  "decollete",
  "fabric",
  "zipper",
  "stretch",
  "silhouette",
  "composition",
] as const;

export type TrProductFeatureKey = (typeof TR_PRODUCT_FEATURE_KEYS)[number];

export const TR_PRODUCT_FEATURE_LABELS: Record<TrProductFeatureKey, string> = {
  gender: "Cinsiyet",
  fit: "Fit",
  color: "Renk",
  neckHem: "Yaka / Paça Detay",
  neckline: "Yaka",
  sleeves: "Kol",
  length: "Boy",
  decollete: "Dekolte",
  fabric: "Kumaş",
  zipper: "Fermuar",
  stretch: "Esneklik",
  silhouette: "Silüet",
  composition: "Kompozisyon",
};

export const TR_PRODUCT_FEATURE_LIMITS: Record<TrProductFeatureKey, number> = {
  gender: 24,
  fit: 80,
  color: 40,
  neckHem: 80,
  neckline: 80,
  sleeves: 40,
  length: 40,
  decollete: 40,
  fabric: 160,
  zipper: 40,
  stretch: 40,
  silhouette: 80,
  composition: 120,
};

const DRESS_SANITIZE_KEYS: DressFeatureKey[] = [
  "neckline",
  "sleeves",
  "length",
  "decollete",
  "fabric",
  "zipper",
  "stretch",
  "silhouette",
];

const EMPTY: TrProductFeatures = {};

const AI_MODEL_ID_RE = /^(studio|boutique):[a-z0-9-]+$/i;

export function sanitizeAiModelId(
  raw: string | null | undefined,
): string | undefined {
  const id = raw?.trim() ?? "";
  if (!id || !AI_MODEL_ID_RE.test(id)) return undefined;
  return id.toLowerCase();
}

export function sanitizeLifestyleModelIds(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const ids = raw.slice(0, 3).map((item) =>
    sanitizeAiModelId(typeof item === "string" ? item : null) ?? "",
  );
  return ids.some(Boolean) ? ids : undefined;
}

/** Model that produced lifestyle shot `index`. Falls back to product-level id. */
export function lifestyleModelIdAt(
  features: TrProductFeatures | null | undefined,
  index: number,
): string | undefined {
  const ids = features?.lifestyleModelIds;
  const at = sanitizeAiModelId(
    typeof ids?.[index] === "string" ? ids[index] : null,
  );
  if (at) return at;
  return sanitizeAiModelId(features?.aiModelId);
}

export function withLifestyleModelShot(
  features: TrProductFeatures | null | undefined,
  index: number,
  modelId: string,
  totalShots: number,
): TrProductFeatures {
  const id = sanitizeAiModelId(modelId);
  const next: TrProductFeatures = { ...(features ?? {}) };
  if (!id) return next;
  const count = Math.max(1, Math.min(3, totalShots));
  const ids = Array.from({ length: count }, (_, slot) => {
    return (
      sanitizeAiModelId(next.lifestyleModelIds?.[slot]) ||
      sanitizeAiModelId(next.aiModelId) ||
      ""
    );
  });
  while (ids.length <= index) ids.push("");
  ids[index] = id;
  next.lifestyleModelIds = ids;
  return next;
}

export function withLifestyleModelsAll(
  features: TrProductFeatures | null | undefined,
  modelId: string,
  shotCount: number,
): TrProductFeatures {
  const id = sanitizeAiModelId(modelId);
  const next: TrProductFeatures = { ...(features ?? {}) };
  if (!id || shotCount < 1) return next;
  const count = Math.min(3, shotCount);
  next.aiModelId = id;
  next.lifestyleModelIds = Array.from({ length: count }, () => id);
  return next;
}

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
    const rawValue = typeof record[key] === "string" ? record[key] : null;
    const mapped = DRESS_SANITIZE_KEYS.includes(key as DressFeatureKey)
      ? resolveDressFeatureValue(key as DressFeatureKey, rawValue)
      : clampFeature(key, rawValue);
    const value = clampFeature(key, mapped);
    if (value) next[key] = value;
  }
  const aiModelId = sanitizeAiModelId(
    typeof record.aiModelId === "string" ? record.aiModelId : null,
  );
  if (aiModelId) next.aiModelId = aiModelId;
  const lifestyleModelIds = sanitizeLifestyleModelIds(record.lifestyleModelIds);
  if (lifestyleModelIds) next.lifestyleModelIds = lifestyleModelIds;
  if (next.neckline && next.neckHem) {
    delete next.neckHem;
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
    if (key === "neckHem" && merged.neckline?.trim()) return [];
    if (key === "fit" && merged.silhouette?.trim()) return [];
    const value = merged[key]?.trim();
    if (!value) return [];
    return [{ key, label: TR_PRODUCT_FEATURE_LABELS[key], value }];
  });
}
