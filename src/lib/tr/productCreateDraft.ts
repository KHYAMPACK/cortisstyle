/**
 * Client-side draft for the yeni ürün wizard.
 *
 * Prefer localStorage over a DB table: photo URLs already live in tr-assets; the
 * draft is small JSON; restore is instant on reload with no new schema/API. Clear on
 * successful save.
 *
 * v3 is the manual wizard (no AI steps). Older drafts are ignored and removed.
 */

import type { TrProductFeatures } from "@/types/tr-marketplace";

export const PRODUCT_CREATE_DRAFT_VERSION = 3 as const;

export interface ProductCreateDraft {
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
  /** A size source id (Beden type, `letter` / `numeric`) or `none`; resolved on restore. */
  sizeChart: string;
  sizeStockInputs: Record<string, string>;
  category: string | null;
  images: string[];
}

function storageKey(boutiqueId: string): string {
  return `tr:product-create-draft:v3:${boutiqueId.trim()}`;
}

/** The AI-era draft (v2): never restored, removed when a new draft is cleared. */
function legacyStorageKey(boutiqueId: string): string {
  return `tr:product-create-draft:v2:${boutiqueId.trim()}`;
}

export function draftHasProgress(draft: ProductCreateDraft): boolean {
  return (
    draft.images.some((u) => Boolean(u?.trim())) ||
    Boolean(draft.title.trim()) ||
    Boolean(draft.priceTry.trim()) ||
    draft.stepIndex > 0
  );
}

export function readProductCreateDraft(
  boutiqueId: string,
): ProductCreateDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(boutiqueId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProductCreateDraft;
    if (parsed?.version !== PRODUCT_CREATE_DRAFT_VERSION) return null;
    if (!Array.isArray(parsed.images)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeProductCreateDraft(
  boutiqueId: string,
  draft: Omit<ProductCreateDraft, "version" | "updatedAt">,
): void {
  if (typeof window === "undefined") return;
  const payload: ProductCreateDraft = {
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
    window.localStorage.removeItem(legacyStorageKey(boutiqueId));
  } catch {
    // ignore
  }
}
