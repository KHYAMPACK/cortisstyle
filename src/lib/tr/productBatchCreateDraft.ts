/**
 * Client-side draft for the toplu ürün wizard (several products in one session).
 *
 * Separate key from the single-product wizard. v4 is the manual flow
 * (photos → listings → prices → stock → preview). Older drafts are ignored and removed.
 */

import { BUILT_IN_SIZE_SOURCES, findSizeSource } from "@/lib/tr/sizeSources";
import { emptyStockInputs } from "@/lib/tr/sizeStockInputs";
import type { TrProductFeatures } from "@/types/tr-marketplace";

export const PRODUCT_BATCH_CREATE_DRAFT_VERSION = 4 as const;

export const BATCH_CREATE_STEPS = [
  "photos",
  "listings",
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
}

export interface ProductBatchCreateDraft {
  version: typeof PRODUCT_BATCH_CREATE_DRAFT_VERSION;
  updatedAt: number;
  stepIndex: number;
  rows: ProductBatchCreateRow[];
}

function storageKey(boutiqueId: string): string {
  return `tr:product-create-batch-draft:v4:${boutiqueId.trim()}`;
}

/** The AI-era draft: never restored, removed when a new draft is cleared. */
function legacyStorageKey(boutiqueId: string): string {
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
  };
}

export function batchRowHasProgress(row: ProductBatchCreateRow): boolean {
  return (
    row.images.some((url) => Boolean(url?.trim())) ||
    Boolean(row.title.trim()) ||
    Boolean(row.priceTry.trim())
  );
}

export function batchDraftHasProgress(draft: ProductBatchCreateDraft): boolean {
  return draft.rows.some(batchRowHasProgress);
}

/** Rows that have at least one photo. */
export function capturedBatchRows(
  rows: ProductBatchCreateRow[],
): ProductBatchCreateRow[] {
  return rows.filter((row) => row.images.some((url) => Boolean(url?.trim())));
}

/** The row's first photo (its cover in the shop). */
export function batchRowCover(row: ProductBatchCreateRow): string | null {
  return row.images.find((url) => Boolean(url?.trim())) ?? null;
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
): ProductBatchCreateDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(boutiqueId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProductBatchCreateDraft;
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
  const payload: ProductBatchCreateDraft = {
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
    window.localStorage.removeItem(legacyStorageKey(boutiqueId));
  } catch {
    // ignore
  }
}
