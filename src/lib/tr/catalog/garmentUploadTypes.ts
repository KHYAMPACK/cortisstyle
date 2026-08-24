/** Garment-specific product upload pipelines. Elbise is live; others are stubs. */

export const GARMENT_UPLOAD_TYPE_IDS = [
  "elbise",
  "ust-giyim",
  "alt-giyim",
  "aksesuar",
  "ev",
] as const;

export type GarmentUploadTypeId = (typeof GARMENT_UPLOAD_TYPE_IDS)[number];

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
    live: false,
    hint: "Yakında",
  },
  {
    id: "alt-giyim",
    label: "Alt giyim",
    categoryId: "alt-giyim",
    live: false,
    hint: "Yakında",
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

/** Elbise FASHN packshot always lives here — not `requiredPhotoSlots`. */
export const ELBISE_PACKSHOT_SLOT = 3;
/** Optional dekolte / detay manken photo. */
export const ELBISE_DETAIL_SLOT = 2;

/** Required owner photo slots before Gemini + ön packshot. */
export function requiredPhotoSlotsForUploadType(
  _uploadType: string | null | undefined,
): number {
  return 2;
}

/** Guided picker tiles (elbise still shows optional detay as slot 2). */
export function guidedPhotoSlotCountForUploadType(
  uploadType: string | null | undefined,
): number {
  return isElbiseUpload(uploadType) ? 3 : 2;
}
