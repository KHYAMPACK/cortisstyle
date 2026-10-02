/** PDP “Ürün özellikleri” — AI-filled on upload, owner-editable. */

import type { ConstructionCatalogFamily } from "@/lib/tr/fashion/types";
import {
  sanitizeColorGroupId,
  sanitizeColorSiblingIds,
} from "@/lib/tr/catalog/colorSiblings";
import type { TrProductFeatures } from "@/types/tr-marketplace";
import type { TrTakimSetItem } from "@/lib/tr/fashion/types";
import {
  resolveDressFeatureValue,
  type DressFeatureKey,
} from "@/lib/tr/fashion/dressFeatures";

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
  "rise",
  "ornament",
  "fabric",
  "zipper",
  "stretch",
  "silhouette",
  "composition",
] as const;

export type TrProductFeatureKey = (typeof TR_PRODUCT_FEATURE_KEYS)[number];

export const TR_PRODUCT_FEATURE_LABELS: Record<TrProductFeatureKey, string> = {
  gender: "Cinsiyet",
  fit: "Kalıp",
  color: "Renk",
  neckHem: "Yaka / Paça Detay",
  neckline: "Yaka",
  sleeves: "Kol",
  length: "Boy",
  decollete: "Dekolte",
  rise: "Bel",
  ornament: "Detay",
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
  rise: 40,
  ornament: 48,
  fabric: 160,
  zipper: 40,
  stretch: 40,
  silhouette: 80,
  composition: 120,
};

const DRESS_SANITIZE_KEYS: DressFeatureKey[] = [
  "neckline",
  "sleeves",
  "fit",
  "length",
  "decollete",
  "rise",
  "fabric",
  "zipper",
  "stretch",
  "silhouette",
];

const EMPTY: TrProductFeatures = {};

const AI_MODEL_ID_RE = /^(studio|boutique):[a-z0-9-]+$/i;

/** PDP “Modelin ölçüleri” for Elle ekle listings that have no try-on kaydı. */
export const MANUAL_LISTING_DEFAULT_MODEL_ID = "studio:selin";

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

export function hasLifestyleModelRecord(
  features: TrProductFeatures | null | undefined,
): boolean {
  return Boolean(
    sanitizeAiModelId(features?.aiModelId) ||
      sanitizeLifestyleModelIds(features?.lifestyleModelIds)?.some(Boolean),
  );
}

/** Fill a sibling SKU that is missing the AI model kaydı. */
export function withCopiedLifestyleModelRecord(
  target: TrProductFeatures | null | undefined,
  source: TrProductFeatures | null | undefined,
): TrProductFeatures {
  const next: TrProductFeatures = { ...(target ?? {}) };
  if (hasLifestyleModelRecord(next) || !hasLifestyleModelRecord(source)) {
    return next;
  }
  const lifestyleModelIds = sanitizeLifestyleModelIds(source?.lifestyleModelIds);
  const aiModelId =
    sanitizeAiModelId(source?.aiModelId) ||
    lifestyleModelIds?.find((id) => id);
  if (aiModelId) next.aiModelId = aiModelId;
  if (lifestyleModelIds) next.lifestyleModelIds = lifestyleModelIds;
  else if (aiModelId) next.lifestyleModelIds = [aiModelId];
  return next;
}

export function emptyProductFeatures(): TrProductFeatures {
  return { ...EMPTY };
}

export function isManualListing(
  product:
    | { features?: TrProductFeatures | null }
    | TrProductFeatures
    | null
    | undefined,
): boolean {
  if (!product) return false;
  const features =
    "features" in product
      ? product.features
      : (product as TrProductFeatures);
  return features?.manualListing === true;
}

export function withManualListing(
  features: TrProductFeatures | null | undefined,
  enabled: boolean,
): TrProductFeatures {
  const next: TrProductFeatures = { ...(features ?? {}) };
  if (enabled) {
    next.manualListing = true;
    if (!sanitizeAiModelId(next.aiModelId)) {
      next.aiModelId = MANUAL_LISTING_DEFAULT_MODEL_ID;
    }
  } else {
    delete next.manualListing;
  }
  return next;
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
    const rawValue =
      key === "neckHem" && typeof record.hem === "string" && !record.neckHem
        ? record.hem
        : typeof record[key] === "string"
          ? record[key]
          : null;
    const mapped =
      key === "neckHem"
        ? resolveDressFeatureValue("hem", rawValue) ||
          clampFeature(key, rawValue)
        : DRESS_SANITIZE_KEYS.includes(key as DressFeatureKey)
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
  if (record.uploadKind === "takim") {
    next.uploadKind = "takim";
    const setItems = sanitizeTakimSetItems(record.setItems);
    if (setItems) next.setItems = setItems;
  }
  if (record.manualListing === true) {
    next.manualListing = true;
  }
  if (record.madeToOrder === true) {
    next.madeToOrder = true;
  }
  if (
    record.sizePricesKurus &&
    typeof record.sizePricesKurus === "object" &&
    !Array.isArray(record.sizePricesKurus)
  ) {
    const prices: Record<string, number> = {};
    for (const [key, value] of Object.entries(record.sizePricesKurus)) {
      if (typeof value === "number" && value > 0) {
        prices[key.trim()] = Math.floor(value);
      }
    }
    if (Object.keys(prices).length > 0) {
      next.sizePricesKurus = prices;
    }
  }
  const colorGroupId = sanitizeColorGroupId(record.colorGroupId);
  const colorSiblingIds = sanitizeColorSiblingIds(record.colorSiblingIds);
  if (colorGroupId && colorSiblingIds) {
    next.colorGroupId = colorGroupId;
    next.colorSiblingIds = colorSiblingIds;
  }
  if (next.neckline && next.neckHem) {
    delete next.neckHem;
  }
  Object.assign(next, sanitizeOwnFieldValues(record));
  return next;
}

/** Longest value of a store's own field (Özellikler), and how many such fields a product keeps. */
export const OWN_FIELD_VALUE_MAX = 400;

/** Longest value a field can hold: the built-in field's own limit, else a store field's. */
export function featureValueMax(key: string): number {
  return (TR_PRODUCT_FEATURE_LIMITS as Record<string, number>)[key] ?? OWN_FIELD_VALUE_MAX;
}
const OWN_FIELDS_MAX = 40;
const OWN_FIELD_KEY = /^[a-z][a-zA-Z0-9]{0,39}$/;

/** Keys this module handles itself (built-in fields and the platform's own data). */
const HANDLED_KEYS: ReadonlySet<string> = new Set<string>([
  ...TR_PRODUCT_FEATURE_KEYS,
  "hem",
  "aiModelId",
  "lifestyleModelIds",
  "uploadKind",
  "setItems",
  "manualListing",
  "madeToOrder",
  "sizePricesKurus",
  "colorGroupId",
  "colorSiblingIds",
]);

/**
 * Values of a store's own product fields (`tr_attribute_definitions`): any other key of
 * the field-key shape holding text. They live next to the built-in ones in `features`,
 * so the editor reads every field the same way (`productKinds/featureValues.ts`).
 */
function sanitizeOwnFieldValues(record: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  let count = 0;
  for (const [key, raw] of Object.entries(record)) {
    if (count >= OWN_FIELDS_MAX) break;
    if (HANDLED_KEYS.has(key) || !OWN_FIELD_KEY.test(key) || typeof raw !== "string") continue;
    const value = raw.replace(/[ \t]+/g, " ").trim().slice(0, OWN_FIELD_VALUE_MAX);
    if (!value) continue;
    out[key] = value;
    count += 1;
  }
  return out;
}

const TAKIM_FAMILIES: ConstructionCatalogFamily[] = [
  "elbise",
  "ust-giyim",
  "alt-giyim",
];

function sanitizeTakimSetItems(raw: unknown): TrTakimSetItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw.slice(0, 2).flatMap((entry): TrTakimSetItem[] => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const row = entry as Record<string, unknown>;
    const family = TAKIM_FAMILIES.includes(row.family as ConstructionCatalogFamily)
      ? (row.family as ConstructionCatalogFamily)
      : null;
    if (!family) return [];
    const chips =
      row.chips && typeof row.chips === "object" && !Array.isArray(row.chips)
        ? (row.chips as Record<string, unknown>)
        : {};
    const chip = (key: string) => {
      const value = chips[key];
      return typeof value === "string" ? value.trim() || null : null;
    };
    return [
      {
        family,
        category: (() => {
          const id =
            typeof row.category === "string" ? row.category.trim() || null : null;
          return id && id !== "takim" ? id : null;
        })(),
        chips: {
          neckline: chip("neckline"),
          sleeves: chip("sleeves"),
          fit: chip("fit"),
          length: chip("length"),
          decollete: chip("decollete"),
          rise: chip("rise"),
          hem: chip("hem"),
        },
      },
    ];
  });
  return items.length > 0 ? items : undefined;
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
    const label =
      key === "neckHem" && merged.rise?.trim()
        ? "Paça"
        : TR_PRODUCT_FEATURE_LABELS[key];
    return [{ key, label, value }];
  });
}
