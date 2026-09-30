/**
 * Client-side draft for the toplu ürün photo-first wizard.
 *
 * Separate key from the single-product wizard. v3 is construction-catalog
 * (photos → chips → listings → models → prices → stock → preview). v1/v2 drafts
 * are ignored and not restored.
 */

import { DEFAULT_CATALOG_BACKGROUND_ID } from "@/lib/tr/catalogBackgrounds/registry";
import { DEFAULT_HOUSE_PHOTOGRAPHY_STYLE } from "@/lib/tr/aiModel/registry";
import type { TrHousePhotographyStyle } from "@/lib/tr/aiModel/types";
import type { OwnerListingDraft } from "@/lib/tr/ownerClient";
import {
  clampDescription,
  clampTitle,
} from "@/lib/tr/ownerProductConstraints";
import { BUILT_IN_SIZE_SOURCES, findSizeSource } from "@/lib/tr/sizeSources";
import { emptyStockInputs } from "@/lib/tr/sizeStockInputs";
import type { ConstructionCatalogFamily } from "@/lib/tr/fashion/garmentUploadTypes";
import type { TrProductFeatures } from "@/types/tr-marketplace";

export const PRODUCT_BATCH_CREATE_DRAFT_VERSION = 3 as const;

export const BATCH_CREATE_STEPS = [
  "photos",
  "chips",
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
  /** A size source id (Beden type, `letter` / `numeric`) or `none`; resolved by the page. */
  sizeChart: string;
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
  photographyStyle?: TrHousePhotographyStyle;
  /** Construction family inferred from the photo (or owner-corrected). */
  uploadType?: ConstructionCatalogFamily | null;
  gateChips?: {
    neckline: string;
    sleeves: string;
    fit: string;
    length: string;
    decollete: string;
    rise: string;
    hem: string;
  };
  proposedChips?: {
    neckline: string;
    sleeves: string;
    fit: string;
    length: string;
    decollete: string;
    rise: string;
    hem: string;
  };
  preparedPrompt?: string;
  packshotError?: string | null;
}

export interface ProductBatchCreateDraftV2 {
  version: typeof PRODUCT_BATCH_CREATE_DRAFT_VERSION;
  updatedAt: number;
  stepIndex: number;
  rows: ProductBatchCreateRow[];
  /** Skip Gemini / FASHN / Photoroom — owner fills fields. */
  manualMode?: boolean;
}

function storageKey(boutiqueId: string): string {
  return `tr:product-create-batch-draft:v2:${boutiqueId.trim()}`;
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
    // The built-in letter list until the page resolves the boutique's Beden types.
    sizeStockInputs: emptyStockInputs(findSizeSource(BUILT_IN_SIZE_SOURCES, "letter"), "0"),
    category: null,
    images: [],
    marketplaceImages: [],
    lifestyleImages: [],
    listingDraft: null,
    frontAnalysisDone: false,
    frontDraftFailed: false,
    catalogBackgroundId: DEFAULT_CATALOG_BACKGROUND_ID,
    selectedModelId: null,
    photographyStyle: DEFAULT_HOUSE_PHOTOGRAPHY_STYLE,
    uploadType: null,
    gateChips: undefined,
    proposedChips: undefined,
    preparedPrompt: "",
    packshotError: null,
  };
}

export function applyBatchListingDraft(
  row: ProductBatchCreateRow,
  draft: OwnerListingDraft,
): Partial<ProductBatchCreateRow> {
  return {
    title: clampTitle(draft.title),
    description: clampDescription(draft.description ?? ""),
    features: draft.features ?? row.features,
    category: draft.category ?? row.category,
    listingDraft: draft,
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
    return { ...parsed, stepIndex, manualMode: parsed.manualMode === true };
  } catch {
    return null;
  }
}

export function writeProductBatchCreateDraft(
  boutiqueId: string,
  input: {
    stepIndex: number;
    rows: ProductBatchCreateRow[];
    manualMode?: boolean;
  },
): void {
  if (typeof window === "undefined") return;
  const payload: ProductBatchCreateDraftV2 = {
    version: PRODUCT_BATCH_CREATE_DRAFT_VERSION,
    updatedAt: Date.now(),
    stepIndex: input.stepIndex,
    rows: input.rows,
    manualMode: input.manualMode === true ? true : undefined,
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
