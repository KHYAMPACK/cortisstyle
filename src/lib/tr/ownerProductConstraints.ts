/** Shared owner-panel input limits for product create/edit. */

export const TR_OWNER_PRODUCT_LIMITS = {
  titleMax: 80,
  descriptionMax: 800,
  maxImages: 8,
  /** Max unsaved product cards in a toplu yükleme session. */
  maxBatchCreateRows: 8,
  /** Front + back get BG removal; extras stay original. */
  cutoutPhotoSlots: 2,
  priceMinTry: 1,
  priceMaxTry: 999_999,
  stockMin: 0,
  stockMax: 9_999,
  sizeLabelMax: 12,
  colorNameMax: 24,
  categoryLabelMax: 40,
} as const;

export type TrProductPhotoRole = "front" | "back" | "extra";

export function getProductPhotoRole(index: number): TrProductPhotoRole {
  if (index === 0) return "front";
  if (index === 1) return "back";
  return "extra";
}

export function productPhotoRoleLabel(role: TrProductPhotoRole): string {
  if (role === "front") return "Ön · Kapak";
  if (role === "back") return "Arka";
  return "Ek fotoğraf";
}

/** Whether the Nth uploaded slot (0-based) should run Photoroom cutout. */
export function shouldRemoveBackgroundForSlot(slotIndex: number): boolean {
  return slotIndex < TR_OWNER_PRODUCT_LIMITS.cutoutPhotoSlots;
}

/** Digits + optional single decimal separator (`.` or `,`). */
export function sanitizeTryPriceInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  const sep = cleaned.includes(",")
    ? ","
    : cleaned.includes(".")
      ? "."
      : null;
  if (!sep) return cleaned.slice(0, 9);
  const [whole = "", ...rest] = cleaned.split(sep);
  const fraction = rest.join("").replace(/[.,]/g, "").slice(0, 2);
  return `${whole.slice(0, 6)}${sep}${fraction}`;
}

export function sanitizeStockInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 4);
}

export function sanitizeSizeLabel(raw: string): string {
  return raw
    .toLocaleUpperCase("tr")
    .replace(/[^0-9A-ZÇĞİÖŞÜ]/g, "")
    .slice(0, TR_OWNER_PRODUCT_LIMITS.sizeLabelMax);
}

export function sanitizeColorName(raw: string): string {
  return raw.slice(0, TR_OWNER_PRODUCT_LIMITS.colorNameMax);
}

export function clampTitle(raw: string): string {
  return raw.slice(0, TR_OWNER_PRODUCT_LIMITS.titleMax);
}

export function clampDescription(raw: string): string {
  return raw.slice(0, TR_OWNER_PRODUCT_LIMITS.descriptionMax);
}

export function parseTryPrice(raw: string): number | null {
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n;
}

export function isValidTryPrice(raw: string): boolean {
  const n = parseTryPrice(raw);
  if (n === null) return false;
  return (
    n >= TR_OWNER_PRODUCT_LIMITS.priceMinTry &&
    n <= TR_OWNER_PRODUCT_LIMITS.priceMaxTry
  );
}

export function isValidStock(raw: string): boolean {
  if (!/^\d+$/.test(raw.trim())) return false;
  const n = Number.parseInt(raw, 10);
  return (
    Number.isFinite(n) &&
    n >= TR_OWNER_PRODUCT_LIMITS.stockMin &&
    n <= TR_OWNER_PRODUCT_LIMITS.stockMax
  );
}
