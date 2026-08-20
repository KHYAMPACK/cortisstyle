/**
 * Client-side draft for the toplu ürün photo-first wizard.
 *
 * Separate key from the single-product wizard. v2 is the stepped session
 * (photos → listings → models → prices → stock → preview). v1 accordion drafts are
 * ignored and not restored.
 */

import { DEFAULT_CATALOG_BACKGROUND_ID } from "@/lib/tr/catalogBackgrounds/registry";
import { LILA_DEFAULT_PHOTOGRAPHY_STYLE } from "@/lib/tr/aiModel/registry";
import type { TrLilaPhotographyStyle } from "@/lib/tr/aiModel/types";
import type { OwnerListingDraft } from "@/lib/tr/ownerClient";
import { sizesForChart, type TrSizeChartId } from "@/lib/tr/productOptions";
import type { TrProductFeatures } from "@/types/tr-marketplace";

export const PRODUCT_BATCH_CREATE_DRAFT_VERSION = 2 as const;

export const BATCH_CREATE_STEPS = [
  "photos",
  "listings",
  "models",
  "prices",
  "stock",
  "preview",
] as const;

export type BatchCreateStepId = (typeof BATCH_CREATE_STEPS)[number];

export interface ProductBatchCreateRow {
  clientId: string;
  title: string;
  description: string;
  features?: TrProductFeatures;
  priceTry: string;
  discountEnabled: boolean;
  salePriceTry: string;
  stock: string;
  sizeChart: TrSizeChartId;
  sizeStockInputs: Record<string, string>;
  category: string | null;
  images: string[];
  marketplaceImages: string[];
  lifestyleImages: string[];
  listingDraft: OwnerListingDraft | null;
  frontAnalysisDone: boolean;
  frontDraftFailed: boolean;
  catalogBackgroundId: string;
  selectedModelId: string | null;
  photographyStyle?: TrLilaPhotographyStyle;
}

export interface ProductBatchCreateDraftV2 {
  version: typeof PRODUCT_BATCH_CREATE_DRAFT_VERSION;
  updatedAt: number;
  stepIndex: number;
  rows: ProductBatchCreateRow[];
}

function storageKey(boutiqueId: string): string {
  return `tr:product-create-batch-draft:v2:${boutiqueId.trim()}`;
}

export function emptyBatchStockInputs(
  chart: TrSizeChartId,
  fill = "0",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const size of sizesForChart(chart)) {
    out[size] = fill;
  }
  return out;
}

export function createEmptyBatchRow(): ProductBatchCreateRow {
  return {
    clientId: crypto.randomUUID(),
    title: "",
    description: "",
    features: {},
    priceTry: "",
    discountEnabled: false,
    salePriceTry: "",
    stock: "1",
    sizeChart: "letter",
    sizeStockInputs: emptyBatchStockInputs("letter", "0"),
    category: null,
    images: [],
    marketplaceImages: [],
    lifestyleImages: [],
    listingDraft: null,
    frontAnalysisDone: false,
    frontDraftFailed: false,
    catalogBackgroundId: DEFAULT_CATALOG_BACKGROUND_ID,
    selectedModelId: null,
    photographyStyle: LILA_DEFAULT_PHOTOGRAPHY_STYLE,
  };
}

export function batchRowHasProgress(row: ProductBatchCreateRow): boolean {
  return (
    row.images.some((url) => Boolean(url?.trim())) ||
    row.marketplaceImages.some((url) => Boolean(url?.trim())) ||
    row.lifestyleImages.some((url) => Boolean(url?.trim())) ||
    Boolean(row.title.trim()) ||
    Boolean(row.priceTry.trim())
  );
}

export function batchDraftHasProgress(draft: ProductBatchCreateDraftV2): boolean {
  return draft.rows.some(batchRowHasProgress);
}

function isBatchRow(value: unknown): value is ProductBatchCreateRow {
  if (!value || typeof value !== "object") return false;
  const row = value as ProductBatchCreateRow;
  return (
    typeof row.clientId === "string" &&
    row.clientId.trim().length > 0 &&
    typeof row.title === "string" &&
    Array.isArray(row.images)
  );
}

export function readProductBatchCreateDraft(
  boutiqueId: string,
): ProductBatchCreateDraftV2 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(boutiqueId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProductBatchCreateDraftV2;
    if (parsed?.version !== PRODUCT_BATCH_CREATE_DRAFT_VERSION) return null;
    if (!Array.isArray(parsed.rows) || !parsed.rows.every(isBatchRow)) {
      return null;
    }
    const stepIndex = Number.isFinite(parsed.stepIndex)
      ? Math.min(
          Math.max(0, Math.floor(parsed.stepIndex)),
          BATCH_CREATE_STEPS.length - 1,
        )
      : 0;
    return { ...parsed, stepIndex };
  } catch {
    return null;
  }
}

export function writeProductBatchCreateDraft(
  boutiqueId: string,
  input: { stepIndex: number; rows: ProductBatchCreateRow[] },
): void {
  if (typeof window === "undefined") return;
  const payload: ProductBatchCreateDraftV2 = {
    version: PRODUCT_BATCH_CREATE_DRAFT_VERSION,
    updatedAt: Date.now(),
    stepIndex: input.stepIndex,
    rows: input.rows,
  };
  if (!batchDraftHasProgress(payload)) {
    clearProductBatchCreateDraft(boutiqueId);
    return;
  }
  try {
    window.localStorage.setItem(storageKey(boutiqueId), JSON.stringify(payload));
  } catch {
    // Quota / private mode — ignore
  }
}

export function clearProductBatchCreateDraft(boutiqueId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(boutiqueId));
  } catch {
    // ignore
  }
}
