/**
 * Client-side draft for the yeni ürün wizard.
 *
 * Prefer localStorage over a DB table: catalog/lifestyle URLs already live in
 * tr-assets; the draft is small JSON; restore is instant on reload with no
 * new schema/API. Clear on successful save.
 */

import type { TrSizeChartId } from "@/lib/tr/productOptions";
import type { OwnerListingDraft } from "@/lib/tr/ownerClient";

export const PRODUCT_CREATE_DRAFT_VERSION = 1 as const;

export interface ProductCreateDraftV1 {
  version: typeof PRODUCT_CREATE_DRAFT_VERSION;
  updatedAt: number;
  stepIndex: number;
  title: string;
  description: string;
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
}

function storageKey(boutiqueId: string): string {
  return `tr:product-create-draft:v1:${boutiqueId.trim()}`;
}

export function draftHasProgress(draft: ProductCreateDraftV1): boolean {
  return (
    draft.images.some((u) => Boolean(u?.trim())) ||
    draft.marketplaceImages.some((u) => Boolean(u?.trim())) ||
    draft.lifestyleImages.some((u) => Boolean(u?.trim())) ||
    Boolean(draft.title.trim()) ||
    Boolean(draft.priceTry.trim()) ||
    draft.stepIndex > 0
  );
}

export function readProductCreateDraft(
  boutiqueId: string,
): ProductCreateDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(boutiqueId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProductCreateDraftV1;
    if (parsed?.version !== PRODUCT_CREATE_DRAFT_VERSION) return null;
    if (!Array.isArray(parsed.images)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeProductCreateDraft(
  boutiqueId: string,
  draft: Omit<ProductCreateDraftV1, "version" | "updatedAt">,
): void {
  if (typeof window === "undefined") return;
  const payload: ProductCreateDraftV1 = {
    ...draft,
    version: PRODUCT_CREATE_DRAFT_VERSION,
    updatedAt: Date.now(),
  };
  if (!draftHasProgress(payload)) {
    clearProductCreateDraft(boutiqueId);
    return;
  }
  try {
    window.localStorage.setItem(storageKey(boutiqueId), JSON.stringify(payload));
  } catch {
    // Quota / private mode — ignore
  }
}

export function clearProductCreateDraft(boutiqueId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(boutiqueId));
  } catch {
    // ignore
  }
}
