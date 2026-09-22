/**
 * Client-side draft for Takım yükleme (two garments → one listing).
 */

import { DEFAULT_CATALOG_BACKGROUND_ID } from "@/lib/tr/catalogBackgrounds/registry";
import type { OwnerListingDraft } from "@/lib/tr/ownerClient";
import {
  clampDescription,
  clampTitle,
} from "@/lib/tr/ownerProductConstraints";
import { sizesForChart, type TrSizeChartId } from "@/lib/tr/productOptions";
import {
  isTakimShopLeaf,
  type ConstructionCatalogFamily,
} from "@/lib/tr/fashion/garmentUploadTypes";
import type { TakimGateChips } from "@/lib/tr/fashion/takimUpload";
import type { TrProductFeatures } from "@/types/tr-marketplace";

export const PRODUCT_TAKIM_CREATE_DRAFT_VERSION = 1 as const;

export const TAKIM_CREATE_STEPS = [
  "photos",
  "chips",
  "listing",
  "models",
  "prices",
  "stock",
  "preview",
] as const;

export type TakimCreateStepId = (typeof TAKIM_CREATE_STEPS)[number];

export interface TakimItemDraft {
  clientId: string;
  title: string;
  description: string;
  features?: TrProductFeatures;
  category: string | null;
  images: string[];
  marketplaceImages: string[];
  listingDraft: OwnerListingDraft | null;
  frontAnalysisDone: boolean;
  frontDraftFailed: boolean;
  uploadType: ConstructionCatalogFamily | null;
  gateChips?: TakimGateChips;
  proposedChips?: TakimGateChips;
  preparedPrompt?: string;
  packshotError?: string | null;
}

export interface ProductTakimCreateDraftV1 {
  version: typeof PRODUCT_TAKIM_CREATE_DRAFT_VERSION;
  updatedAt: number;
  stepIndex: number;
  items: [TakimItemDraft, TakimItemDraft];
  title: string;
  description: string;
  features: TrProductFeatures;
  priceTry: string;
  discountEnabled: boolean;
  salePriceTry: string;
  stock: string;
  sizeChart: TrSizeChartId;
  sizeStockInputs: Record<string, string>;
  lifestyleImages: string[];
  catalogBackgroundId: string;
  selectedModelId: string | null;
  /** Skip Gemini / FASHN / Photoroom — owner fills fields. */
  manualMode?: boolean;
}

function storageKey(boutiqueId: string): string {
  return `tr:product-create-takim-draft:v1:${boutiqueId.trim()}`;
}

export function emptyTakimStockInputs(
  chart: TrSizeChartId,
  fill = "0",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const size of sizesForChart(chart)) {
    out[size] = fill;
  }
  return out;
}

export function createEmptyTakimItem(): TakimItemDraft {
  return {
    clientId: crypto.randomUUID(),
    title: "",
    description: "",
    features: {},
    category: null,
    images: [],
    marketplaceImages: [],
    listingDraft: null,
    frontAnalysisDone: false,
    frontDraftFailed: false,
    uploadType: null,
    gateChips: undefined,
    proposedChips: undefined,
    preparedPrompt: "",
    packshotError: null,
  };
}

export function createEmptyTakimDraft(): Omit<
  ProductTakimCreateDraftV1,
  "version" | "updatedAt"
> {
  return {
    stepIndex: 0,
    items: [createEmptyTakimItem(), createEmptyTakimItem()],
    title: "",
    description: "",
    features: {},
    priceTry: "",
    discountEnabled: false,
    salePriceTry: "",
    stock: "1",
    sizeChart: "letter",
    sizeStockInputs: emptyTakimStockInputs("letter", "0"),
    lifestyleImages: [],
    catalogBackgroundId: DEFAULT_CATALOG_BACKGROUND_ID,
    selectedModelId: null,
  };
}

export function applyTakimItemListingDraft(
  item: TakimItemDraft,
  draft: OwnerListingDraft,
): Partial<TakimItemDraft> {
  const nextCategory = draft.category ?? item.category;
  return {
    title: clampTitle(draft.title),
    description: clampDescription(draft.description ?? ""),
    features: draft.features ?? item.features,
    category: isTakimShopLeaf(nextCategory) ? null : nextCategory,
    listingDraft: draft,
  };
}

export function takimDraftHasProgress(
  draft: Pick<ProductTakimCreateDraftV1, "items" | "title" | "priceTry">,
): boolean {
  return (
    Boolean(draft.title.trim()) ||
    Boolean(draft.priceTry.trim()) ||
    draft.items.some(
      (item) =>
        item.images.some((url) => Boolean(url?.trim())) ||
        item.marketplaceImages.some((url) => Boolean(url?.trim())) ||
        Boolean(item.title.trim()),
    )
  );
}

function isTakimItem(value: unknown): value is TakimItemDraft {
  if (!value || typeof value !== "object") return false;
  const item = value as TakimItemDraft;
  return (
    typeof item.clientId === "string" &&
    item.clientId.trim().length > 0 &&
    Array.isArray(item.images)
  );
}

export function readProductTakimCreateDraft(
  boutiqueId: string,
): ProductTakimCreateDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(boutiqueId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProductTakimCreateDraftV1;
    if (parsed?.version !== PRODUCT_TAKIM_CREATE_DRAFT_VERSION) return null;
    if (
      !Array.isArray(parsed.items) ||
      parsed.items.length !== 2 ||
      !parsed.items.every(isTakimItem)
    ) {
      return null;
    }
    const stepIndex = Number.isFinite(parsed.stepIndex)
      ? Math.min(
          Math.max(0, Math.floor(parsed.stepIndex)),
          TAKIM_CREATE_STEPS.length - 1,
        )
      : 0;
    return {
      ...parsed,
      items: [parsed.items[0]!, parsed.items[1]!],
      stepIndex,
    };
  } catch {
    return null;
  }
}

export function writeProductTakimCreateDraft(
  boutiqueId: string,
  input: Omit<ProductTakimCreateDraftV1, "version" | "updatedAt">,
): void {
  if (typeof window === "undefined") return;
  const payload: ProductTakimCreateDraftV1 = {
    version: PRODUCT_TAKIM_CREATE_DRAFT_VERSION,
    updatedAt: Date.now(),
    ...input,
  };
  if (!takimDraftHasProgress(payload)) {
    clearProductTakimCreateDraft(boutiqueId);
    return;
  }
  try {
    window.localStorage.setItem(storageKey(boutiqueId), JSON.stringify(payload));
  } catch {
    // Quota / private mode
  }
}

export function clearProductTakimCreateDraft(boutiqueId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(boutiqueId));
  } catch {
    // ignore
  }
}
