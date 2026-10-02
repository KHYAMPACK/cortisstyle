import { isTrCategoryMatch } from "@/lib/tr/fashion/categories";

/** Garment-specific product upload pipelines. Elbise + üst giyim + alt giyim are live. */

export const GARMENT_UPLOAD_TYPE_IDS = [
  "elbise",
  "ust-giyim",
  "alt-giyim",
  "aksesuar",
  "ev",
] as const;

export type GarmentUploadTypeId = (typeof GARMENT_UPLOAD_TYPE_IDS)[number];

export type ConstructionCatalogFamily = "elbise" | "ust-giyim" | "alt-giyim";

export interface GarmentUploadType {
  id: GarmentUploadTypeId;
  label: string;
  /** Shop leaf / category id written on the product. */
  categoryId: string;
  live: boolean;
  hint: string;
}

export const GARMENT_UPLOAD_TYPES: GarmentUploadType[] = [
  {
    id: "elbise",
    label: "Elbise",
    categoryId: "elbise",
    live: true,
    hint: "Ön manken, arka manken, isteğe bağlı dekolte detay + ön packshot",
  },
  {
    id: "ust-giyim",
    label: "Üst giyim",
    categoryId: "ust-giyim",
    live: true,
    hint: "Ön manken, arka manken, isteğe bağlı detay + ön packshot",
  },
  {
    id: "alt-giyim",
    label: "Alt giyim",
    categoryId: "alt-giyim",
    live: true,
    hint: "Ön manken, arka manken, isteğe bağlı detay + düz serim packshot",
  },
  {
    id: "aksesuar",
    label: "Aksesuar",
    categoryId: "aksesuar",
    live: false,
    hint: "Yakında",
  },
  {
    id: "ev",
    label: "Ev",
    categoryId: "ev",
    live: false,
    hint: "Yakında",
  },
];

export function getGarmentUploadType(
  id: string | null | undefined,
): GarmentUploadType | null {
  if (!id?.trim()) return null;
  return GARMENT_UPLOAD_TYPES.find((entry) => entry.id === id.trim()) ?? null;
}

export function parseGarmentUploadTypeId(
  raw: string | null | undefined,
): GarmentUploadTypeId | null {
  const id = raw?.trim();
  if (!id) return null;
  return GARMENT_UPLOAD_TYPES.some((entry) => entry.id === id)
    ? (id as GarmentUploadTypeId)
    : null;
}

export function isElbiseUpload(
  uploadType: string | null | undefined,
): boolean {
  return parseGarmentUploadTypeId(uploadType) === "elbise";
}

/** Parent `ust-giyim` or any descendant leaf (bluz, gömlek, …). */
export function isUstGiyimCategory(
  category: string | null | undefined,
): boolean {
  return isTrCategoryMatch(category, "ust-giyim");
}

/** Shop leaf under üst giyim — never the parent tile. */
export function isUstGiyimShopLeaf(
  category: string | null | undefined,
): boolean {
  const id = category?.trim();
  if (!id || id === "ust-giyim") return false;
  return isUstGiyimCategory(id);
}

/** Two-piece set listing. Shop leaf under üst giyim; own upload pipeline. */
export const TAKIM_SHOP_LEAF = "takim";

export function isTakimShopLeaf(
  category: string | null | undefined,
): boolean {
  return isTrCategoryMatch(category, TAKIM_SHOP_LEAF);
}

/** Parent `alt-giyim` or any descendant leaf (etek, pantolon, …). */
export function isAltGiyimCategory(
  category: string | null | undefined,
): boolean {
  return isTrCategoryMatch(category, "alt-giyim");
}

/** Shop leaf under alt giyim — never the parent tile. */
export function isAltGiyimShopLeaf(
  category: string | null | undefined,
): boolean {
  const id = category?.trim();
  if (!id || id === "alt-giyim") return false;
  return isAltGiyimCategory(id);
}

/** Etek (and etek variants) — no Paça chip; dress-style boy. */
export function isAltGiyimSkirtLeaf(
  category: string | null | undefined,
): boolean {
  return isTrCategoryMatch(category, "etek");
}

/** Pantolon / eşofman — Paça required. Unknown leaf defaults to this. */
export function altGiyimUsesPaca(
  category: string | null | undefined,
): boolean {
  return !isAltGiyimSkirtLeaf(category);
}

export function constructionCatalogFamily(
  uploadType?: string | null,
  category?: string | null,
): ConstructionCatalogFamily | null {
  if (isTakimShopLeaf(category)) return null;
  const type = parseGarmentUploadTypeId(uploadType);
  if (type === "elbise" || type === "ust-giyim" || type === "alt-giyim") {
    return type;
  }
  if (isElbiseUpload(category)) return "elbise";
  if (isUstGiyimCategory(category)) return "ust-giyim";
  if (isAltGiyimCategory(category)) return "alt-giyim";
  return null;
}

/** Where an AI-made product (parked pipeline) keeps its packshot — not `requiredPhotoSlots`. */
export const ELBISE_PACKSHOT_SLOT = 3;
/** Front + back photos an AI-made product (parked pipeline) was created from. */
export const REQUIRED_PHOTO_SLOTS = 2;

