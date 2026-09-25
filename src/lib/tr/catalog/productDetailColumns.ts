import type { TrProductDetails } from "@/types/tr-marketplace";

/**
 * Columns from `patch_product_details.sql`. Values are only sent when there is
 * something to store (create) or the owner touched the field (update), so a database
 * without the patch still saves everything else; real values for a column that is
 * missing fail with a message instead of vanishing.
 */
export const DETAIL_COLUMNS: ReadonlySet<string> = new Set([
  "description_html",
  "brand",
  "tags",
  "google_category",
  "sku",
  "barcode",
  "desi",
  "continue_selling_when_out_of_stock",
  "unit_price_enabled",
  "unit_amount",
  "unit_type",
]);

export const DETAILS_PATCH_MISSING =
  "Ürün ayrıntıları kaydedilemedi: veritabanı güncellemesi (patch_product_details.sql) henüz uygulanmamış.";

export function detailRow(input: Partial<TrProductDetails>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.descriptionHtml !== undefined) row.description_html = input.descriptionHtml;
  if (input.brand !== undefined) row.brand = input.brand;
  if (input.tags !== undefined) row.tags = input.tags;
  if (input.googleCategory !== undefined) row.google_category = input.googleCategory;
  if (input.sku !== undefined) row.sku = input.sku;
  if (input.barcode !== undefined) row.barcode = input.barcode;
  if (input.desi !== undefined) row.desi = input.desi;
  if (input.continueSelling !== undefined) {
    row.continue_selling_when_out_of_stock = input.continueSelling;
  }
  if (input.unitPrice !== undefined) {
    row.unit_price_enabled = input.unitPrice?.enabled ?? false;
    row.unit_amount = input.unitPrice?.amount ?? null;
    row.unit_type = input.unitPrice?.type ?? null;
  }
  return row;
}

/** A detail value that equals the column default (so leaving it out changes nothing). */
export function isEmptyDetail(value: unknown): boolean {
  return (
    value === null ||
    value === false ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function withoutDetailColumns(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).filter(([column]) => !DETAIL_COLUMNS.has(column)),
  );
}

/** Whether a row carries a real (non-default) value for any detail column. */
export function hasDetailValue(row: Record<string, unknown>): boolean {
  return Object.entries(row).some(
    ([column, value]) => DETAIL_COLUMNS.has(column) && !isEmptyDetail(value),
  );
}
