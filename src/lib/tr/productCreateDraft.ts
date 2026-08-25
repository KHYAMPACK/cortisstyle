/**
 * Client-side draft for the yeni ürün wizard.
 *
 * Prefer localStorage over a DB table: catalog/lifestyle URLs already live in
 * tr-assets; the draft is small JSON; restore is instant on reload with no
 * new schema/API. Clear on successful save.
 *
 * v2 is photo-first (no Tür step). v1 drafts are ignored and not restored.
 */

import type { TrSizeChartId } from "@/lib/tr/productOptions";
import type { OwnerListingDraft } from "@/lib/tr/ownerClient";
import type { TrProductFeatures } from "@/types/tr-marketplace";
import type { TrLilaPhotographyStyle } from "@/lib/tr/aiModel/types";
import {
  sanitizeColorVariantDrafts,
  type ColorVariantUploadDraft,
} from "@/lib/tr/catalog/colorSiblings";

export const PRODUCT_CREATE_DRAFT_VERSION = 2 as const;

export interface ProductCreateDraftV2 {
  version: typeof PRODUCT_CREATE_DRAFT_VERSION;
  updatedAt: number;
  stepIndex: number;
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
  /** Construction family inferred from the photo (or owner-corrected). */
  uploadType?: string | null;
  /** Extra color photo pairs (linked SKUs). */
  colorVariants?: ColorVariantUploadDraft[];
}

function storageKey(boutiqueId: string): string {
  return `tr:product-create-draft:v2:${boutiqueId.trim()}`;
}

export function draftHasProgress(draft: ProductCreateDraftV2): boolean {
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
): ProductCreateDraftV2 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(boutiqueId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProductCreateDraftV2;
    if (parsed?.version !== PRODUCT_CREATE_DRAFT_VERSION) return null;
    if (!Array.isArray(parsed.images)) return null;
    parsed.colorVariants = sanitizeColorVariantDrafts(parsed.colorVariants);
    return parsed;
  } catch {
    return null;
  }
}

export function writeProductCreateDraft(
  boutiqueId: string,
  draft: Omit<ProductCreateDraftV2, "version" | "updatedAt">,
): void {
  if (typeof window === "undefined") return;
  const payload: ProductCreateDraftV2 = {
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
