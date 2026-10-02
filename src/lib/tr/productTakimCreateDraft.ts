/**
 * Client-side draft for Takım yükleme (a two-piece set saved as one product).
 *
 * v2 is the manual flow (photos → listing → prices → stock → preview). Older drafts
 * are ignored and removed.
 */

import { BUILT_IN_SIZE_SOURCES, findSizeSource } from "@/lib/tr/sizeSources";
import { emptyStockInputs } from "@/lib/tr/sizeStockInputs";
import type { TrProductFeatures } from "@/types/tr-marketplace";

export const PRODUCT_TAKIM_CREATE_DRAFT_VERSION = 2 as const;

export const TAKIM_CREATE_STEPS = [
  "photos",
  "listing",
  "prices",
  "stock",
  "preview",
] as const;

export type TakimCreateStepId = (typeof TAKIM_CREATE_STEPS)[number];

export interface ProductTakimCreateDraft {
  version: typeof PRODUCT_TAKIM_CREATE_DRAFT_VERSION;
  updatedAt: number;
  stepIndex: number;
  images: string[];
  title: string;
  description: string;
  features: TrProductFeatures;
  priceTry: string;
  discountEnabled: boolean;
  salePriceTry: string;
  stock: string;
  /** A size source id (Beden type, `letter` / `numeric`) or `none`; resolved by the page. */
  sizeChart: string;
  sizeStockInputs: Record<string, string>;
}

export type ProductTakimCreateFields = Omit<
  ProductTakimCreateDraft,
  "version" | "updatedAt"
>;

function storageKey(boutiqueId: string): string {
  return `tr:product-create-takim-draft:v2:${boutiqueId.trim()}`;
}

/** The AI-era draft (v1): never restored, removed when a new draft is cleared. */
function legacyStorageKey(boutiqueId: string): string {
  return `tr:product-create-takim-draft:v1:${boutiqueId.trim()}`;
}

export function createEmptyTakimDraft(): ProductTakimCreateFields {
  return {
    stepIndex: 0,
    images: [],
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
  };
}

export function takimDraftHasProgress(
  draft: Pick<ProductTakimCreateDraft, "images" | "title" | "priceTry">,
): boolean {
  return (
    Boolean(draft.title.trim()) ||
    Boolean(draft.priceTry.trim()) ||
    draft.images.some((url) => Boolean(url?.trim()))
  );
}

export function readProductTakimCreateDraft(
  boutiqueId: string,
): ProductTakimCreateDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(boutiqueId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProductTakimCreateDraft;
    if (parsed?.version !== PRODUCT_TAKIM_CREATE_DRAFT_VERSION) return null;
    if (!Array.isArray(parsed.images)) return null;
    const stepIndex = Number.isFinite(parsed.stepIndex)
      ? Math.min(
          Math.max(0, Math.floor(parsed.stepIndex)),
          TAKIM_CREATE_STEPS.length - 1,
        )
      : 0;
    return { ...parsed, stepIndex };
  } catch {
    return null;
  }
}

export function writeProductTakimCreateDraft(
  boutiqueId: string,
  input: ProductTakimCreateFields,
): void {
  if (typeof window === "undefined") return;
  const payload: ProductTakimCreateDraft = {
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
    window.localStorage.removeItem(legacyStorageKey(boutiqueId));
  } catch {
    // ignore
  }
}
