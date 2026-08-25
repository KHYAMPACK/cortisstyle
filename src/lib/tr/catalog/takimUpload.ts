import { buildElbiseTryOnConstructionLock } from "@/lib/tr/aiCatalog/elbiseConstructionLock";
import { TR_OWNER_PRODUCT_LIMITS } from "@/lib/tr/ownerProductConstraints";
import { getTrCategoryLabel } from "@/lib/tr/catalog/categories";
import {
  altGiyimUsesPaca,
  TAKIM_SHOP_LEAF,
  type ConstructionCatalogFamily,
} from "@/lib/tr/catalog/garmentUploadTypes";
import { isTrMarketplaceAssetUrl } from "@/lib/tr/trAssetUrls";
import type { TrProduct, TrProductFeatures, TrTakimSetItem } from "@/types/tr-marketplace";

export { TAKIM_SHOP_LEAF };

/** Item 1 ön / arka, item 2 ön / arka in `images`. */
export const TAKIM_ITEM1_FRONT = 0;
export const TAKIM_ITEM1_BACK = 1;
export const TAKIM_ITEM2_FRONT = 2;
export const TAKIM_ITEM2_BACK = 3;

/** Per-item packshots in `marketplaceImages` — not slot 3. */
export const TAKIM_PACKSHOT_1 = 0;
export const TAKIM_PACKSHOT_2 = 1;

export const TAKIM_ITEM_COUNT = 2;

export type TakimGateChips = {
  neckline: string;
  sleeves: string;
  fit: string;
  length: string;
  decollete: string;
  rise: string;
  hem: string;
};

export function isTakimCatalogProduct(
  product: Pick<TrProduct, "features"> | { features?: TrProductFeatures | null },
): boolean {
  return product.features?.uploadKind === "takim";
}

export function takimItemHasBothPhotos(images: string[]): boolean {
  return Boolean(images[0]?.trim() && images[1]?.trim());
}

export function takimItemPackshotUrl(item: {
  images: string[];
  marketplaceImages: string[];
}): string {
  return (
    item.marketplaceImages[3]?.trim() ||
    item.images[3]?.trim() ||
    ""
  );
}

export function takimItemChipsReady(input: {
  family: ConstructionCatalogFamily | null;
  category: string | null;
  chips?: TakimGateChips | null;
}): boolean {
  const { family, chips } = input;
  if (!family || !chips) return false;
  if (family === "alt-giyim") {
    const base = Boolean(
      chips.length.trim() && chips.rise.trim() && chips.fit.trim(),
    );
    if (!base) return false;
    if (!altGiyimUsesPaca(input.category)) return true;
    return Boolean(chips.hem.trim());
  }
  const base = Boolean(
    chips.neckline.trim() && chips.sleeves.trim() && chips.length.trim(),
  );
  if (!base) return false;
  if (family === "ust-giyim") return Boolean(chips.fit.trim());
  return true;
}

export function assembleTakimProductImages(items: Array<{
  images: string[];
  marketplaceImages: string[];
}>): { images: string[]; marketplaceImages: string[] } {
  const first = items[0];
  const second = items[1];
  return {
    images: [
      first?.images[0]?.trim() || "",
      first?.images[1]?.trim() || "",
      second?.images[0]?.trim() || "",
      second?.images[1]?.trim() || "",
    ],
    marketplaceImages: [
      takimItemPackshotUrl(first ?? { images: [], marketplaceImages: [] }),
      takimItemPackshotUrl(second ?? { images: [], marketplaceImages: [] }),
    ],
  };
}

export function takimPackshotUrls(product: {
  marketplaceImages?: string[] | null;
  features?: TrProductFeatures | null;
}): string[] {
  if (!isTakimCatalogProduct(product)) return [];
  const market = product.marketplaceImages ?? [];
  return [market[TAKIM_PACKSHOT_1], market[TAKIM_PACKSHOT_2]]
    .map((url) => url?.trim() || "")
    .filter((url) => Boolean(url) && isTrMarketplaceAssetUrl(url));
}

export function formatTakimProductTitle(items: Array<{
  features?: TrProductFeatures | null;
  category?: string | null;
}>): string | null {
  const color =
    items
      .map((item) => item.features?.color?.replace(/\s+/g, " ").trim())
      .find(Boolean) || "";
  const leaves = items
    .map((item) => {
      const id = item.category?.trim() || "";
      if (!id || id === TAKIM_SHOP_LEAF) return "";
      return getTrCategoryLabel(id)?.trim() || "";
    })
    .filter(Boolean);
  const parts = [color, ...leaves, "Takım"].filter(Boolean);
  if (parts.length < 2) return null;
  return parts.join(" ").slice(0, TR_OWNER_PRODUCT_LIMITS.titleMax);
}

export function setItemsFromTakimDraft(items: Array<{
  uploadType?: ConstructionCatalogFamily | null;
  category?: string | null;
  gateChips?: TakimGateChips | null;
}>): TrTakimSetItem[] {
  return items.map((item) => ({
    family: item.uploadType ?? "ust-giyim",
    category: item.category ?? null,
    chips: {
      neckline: item.gateChips?.neckline || null,
      sleeves: item.gateChips?.sleeves || null,
      fit: item.gateChips?.fit || null,
      length: item.gateChips?.length || null,
      decollete: item.gateChips?.decollete || null,
      rise: item.gateChips?.rise || null,
      hem: item.gateChips?.hem || null,
    },
  }));
}

export function orderTakimItemsForTryOn<T extends {
  family: ConstructionCatalogFamily | null;
}>(items: T[]): T[] {
  const rank = (family: ConstructionCatalogFamily | null) => {
    if (family === "ust-giyim") return 0;
    if (family === "elbise") return 1;
    if (family === "alt-giyim") return 2;
    return 3;
  };
  return [...items].sort((a, b) => rank(a.family) - rank(b.family));
}

const KEEP_PREVIOUS =
  "The model already wears the first garment from the previous try-on. Keep that garment exactly. Add this second piece. Do not replace or remove the first garment. Do not invent extra pieces.";

export function takimTryOnPrompt(input: {
  chips: TakimGateChips | null | undefined;
  family: ConstructionCatalogFamily | null;
  kind: "front" | "back";
  keepPreviousGarment: boolean;
}): string {
  const lock = buildElbiseTryOnConstructionLock(
    input.chips ?? {},
    input.family,
    "",
  );
  const keep = input.keepPreviousGarment ? KEEP_PREVIOUS : "";
  const view =
    input.kind === "back"
      ? "Full rear view: the model is turned away so both garments' backs are visible."
      : "Full body from head to toe; both garments must be fully visible.";
  return [lock, keep, view].filter(Boolean).join(" ");
}
