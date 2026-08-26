/**
 * Mock on-model body stats for boutique PDPs.
 * Values are stand-ins per AI / house model — not real measurements.
 */

import {
  isManualListing,
  MANUAL_LISTING_DEFAULT_MODEL_ID,
  sanitizeAiModelId,
  sanitizeLifestyleModelIds,
} from "@/lib/tr/catalog/productFeatures";
import { detectSizeChart } from "@/lib/tr/catalog/productOptions";
import type { TrProductFeatures } from "@/types/tr-marketplace";

export type TrModelScale = {
  modelId: string;
  heightCm: number;
  waistCm: number;
  bustCm: number;
  hipCm: number;
  weightKg: number;
  wearingSizeLetter: string;
  wearingSizeNumeric: string;
};

export type TrResolvedModelScale = TrModelScale & {
  measurementsLabel: string;
  wearingSizeLabel: string;
};

const DEFAULT_WOMAN_MODEL_ID = "studio:ayla";
const DEFAULT_MAN_MODEL_ID = "studio:deniz";

/** Fixed mock scales keyed by `studio:*` / `boutique:*` model id. */
export const MODEL_SCALES: Record<string, TrModelScale> = {
  "studio:ayla": {
    modelId: "studio:ayla",
    heightCm: 171,
    waistCm: 60,
    bustCm: 80,
    hipCm: 90,
    weightKg: 49,
    wearingSizeLetter: "S",
    wearingSizeNumeric: "36",
  },
  "studio:selin": {
    modelId: "studio:selin",
    heightCm: 166,
    waistCm: 60,
    bustCm: 80,
    hipCm: 90,
    weightKg: 59,
    wearingSizeLetter: "S",
    wearingSizeNumeric: "36",
  },
  "studio:deniz": {
    modelId: "studio:deniz",
    heightCm: 184,
    waistCm: 78,
    bustCm: 98,
    hipCm: 96,
    weightKg: 76,
    wearingSizeLetter: "M",
    wearingSizeNumeric: "32",
  },
  "boutique:lilabutik": {
    modelId: "boutique:lilabutik",
    heightCm: 174,
    waistCm: 67,
    bustCm: 88,
    hipCm: 97,
    weightKg: 57,
    wearingSizeLetter: "M",
    wearingSizeNumeric: "38",
  },
  "boutique:pervinsoysalbutik": {
    modelId: "boutique:pervinsoysalbutik",
    heightCm: 165,
    waistCm: 64,
    bustCm: 84,
    hipCm: 94,
    weightKg: 54,
    wearingSizeLetter: "M",
    wearingSizeNumeric: "38",
  },
};

function isMensProduct(features: TrProductFeatures | null | undefined): boolean {
  const gender = features?.gender?.trim().toLocaleLowerCase("tr") ?? "";
  return gender === "erkek" || gender === "man" || gender === "male";
}

export function getModelScale(modelId: string | null | undefined): TrModelScale | null {
  const id = sanitizeAiModelId(modelId);
  if (!id) return null;
  return MODEL_SCALES[id] ?? null;
}

function pickProductModelId(
  features: TrProductFeatures | null | undefined,
): string {
  const stored = sanitizeAiModelId(features?.aiModelId);
  if (stored && MODEL_SCALES[stored]) return stored;

  const lifestyle = sanitizeLifestyleModelIds(features?.lifestyleModelIds) ?? [];
  for (const id of lifestyle) {
    if (id && MODEL_SCALES[id]) return id;
  }

  if (isManualListing(features)) return MANUAL_LISTING_DEFAULT_MODEL_ID;

  return isMensProduct(features)
    ? DEFAULT_MAN_MODEL_ID
    : DEFAULT_WOMAN_MODEL_ID;
}

export function formatModelMeasurements(scale: TrModelScale): string {
  return [
    `Boy: ${scale.heightCm}cm`,
    `Bel: ${scale.waistCm}cm`,
    `Göğüs: ${scale.bustCm}cm`,
    `Basen: ${scale.hipCm}cm`,
    `Kilo: ${scale.weightKg}kg`,
  ].join(" / ");
}

export function formatWearingSize(
  scale: TrModelScale,
  sizes: string[],
): string {
  const chart = detectSizeChart(sizes);
  const size =
    chart === "numeric" ? scale.wearingSizeNumeric : scale.wearingSizeLetter;
  return `${size} Beden`;
}

/** Null when the product has no size system (accessories / one-size-none). */
export function resolveProductModelScale(input: {
  sizes: string[];
  features?: TrProductFeatures | null;
}): TrResolvedModelScale | null {
  if (detectSizeChart(input.sizes) === "none") return null;
  const modelId = pickProductModelId(input.features);
  const scale = MODEL_SCALES[modelId] ?? MODEL_SCALES[DEFAULT_WOMAN_MODEL_ID]!;
  return {
    ...scale,
    measurementsLabel: formatModelMeasurements(scale),
    wearingSizeLabel: formatWearingSize(scale, input.sizes),
  };
}
