/**
 * Premade catalog backgrounds — one selection per product.
 * Applied behind cutout (front/back) previews; not per-photo.
 */

export interface TrCatalogBackground {
  id: string;
  label: string;
  /** CSS background value for preview / storefront. */
  css: string;
}

export const TR_CATALOG_BACKGROUNDS: readonly TrCatalogBackground[] = [
  {
    id: "studio-white",
    label: "Studio beyaz",
    css: "#FFFFFF",
  },
  {
    id: "soft-ivory",
    label: "Fildişi",
    css: "#F7F3EB",
  },
  {
    id: "blush",
    label: "Pudra",
    css: "#F6E8EC",
  },
  {
    id: "warm-sand",
    label: "Kum",
    css: "#E8DFD0",
  },
  {
    id: "cool-gray",
    label: "Açık gri",
    css: "#E8EAED",
  },
  {
    id: "soft-sage",
    label: "Adaçayı",
    css: "#E4EBE4",
  },
  {
    id: "dawn",
    label: "Şafak",
    css: "linear-gradient(165deg, #FBF6F0 0%, #EFE4D8 55%, #E8D5C8 100%)",
  },
  {
    id: "cutout",
    label: "Şeffaf kesit",
    css: "repeating-conic-gradient(#e5e5e5 0% 25%, #ffffff 0% 50%) 50% / 16px 16px",
  },
] as const;

export const DEFAULT_CATALOG_BACKGROUND_ID = "studio-white";

export function getCatalogBackground(
  id: string | null | undefined,
): TrCatalogBackground {
  const found = TR_CATALOG_BACKGROUNDS.find((entry) => entry.id === id);
  return (
    found ??
    TR_CATALOG_BACKGROUNDS.find(
      (entry) => entry.id === DEFAULT_CATALOG_BACKGROUND_ID,
    )!
  );
}

export function isCatalogBackgroundId(id: string): boolean {
  return TR_CATALOG_BACKGROUNDS.some((entry) => entry.id === id);
}
