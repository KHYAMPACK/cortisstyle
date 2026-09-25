import { isUnitType, UNIT_AMOUNT_MAX } from "@/lib/tr/productUnits";
import { RICH_TEXT_HTML_MAX_LENGTH } from "@/lib/tr/richText";
import type { TrUnitPrice } from "@/types/tr-marketplace";

/**
 * Rules for the Basit ürün's detail fields (Ürün detayı, Envanter, Stok, Birim fiyat).
 * The owner API reads request bodies with `readProductDetailsBody`, and the editor
 * validates with the same function, so a rule lives in one place.
 */

export const PRODUCT_DETAIL_LIMITS = {
  brandMax: 120,
  supplierMax: 120,
  googleCategoryMax: 250,
  tagMax: 40,
  tagsMax: 20,
  skuMax: 64,
  barcodeMax: 64,
  hsCodeMax: 16,
  desiMax: 9_999.99,
} as const;

/** What a request may set. `undefined` = not sent (leave it alone); `null` = clear it. */
export interface ProductDetailsBody {
  /** Unsanitized HTML from the editor; the route sanitizes it. */
  descriptionHtml?: string | null;
  brand?: string | null;
  tags?: string[];
  googleCategory?: string | null;
  sku?: string | null;
  barcode?: string | null;
  desi?: number | null;
  continueSelling?: boolean;
  unitPrice?: TrUnitPrice;
  /** Owner-only (`tr_product_private`). */
  supplier?: string | null;
  hsCode?: string | null;
}

/** Tags as the owner typed them: trimmed, single-spaced, no blanks, no repeats. */
export function normalizeTags(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const value of values) {
    const tag = value.replace(/\s+/g, " ").trim();
    if (!tag) continue;
    const key = tag.toLocaleLowerCase("tr");
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

/** Digits with one decimal separator, for number inputs (desi, unit amount). */
export function sanitizeDecimalInput(
  raw: string,
  maxDecimals: number,
  maxWholeDigits: number,
): string {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  const sep = cleaned.includes(",") ? "," : cleaned.includes(".") ? "." : null;
  if (!sep) return cleaned.slice(0, maxWholeDigits);
  const [whole = "", ...rest] = cleaned.split(sep);
  const fraction = rest.join("").replace(/[.,]/g, "").slice(0, maxDecimals);
  return `${whole.slice(0, maxWholeDigits)}${sep}${fraction}`;
}

/** A typed number (`12,5` or `12.5`), or `null` when empty or not a number. */
export function parseDecimalInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function readText(
  value: unknown,
  max: number,
  label: string,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") throw new Error(`${label} geçersiz.`);
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (text.length > max) {
    throw new Error(`${label} en fazla ${max} karakter olabilir.`);
  }
  return text;
}

/** SKU from a request value: trimmed text, `null` when blank, `undefined` when not sent. */
export function readSkuValue(value: unknown): string | null | undefined {
  const sku = readText(value, PRODUCT_DETAIL_LIMITS.skuMax, "SKU");
  if (sku !== undefined && sku !== null && /[\u0000-\u001f\u007f]/.test(sku)) {
    throw new Error("SKU geçersiz karakter içeriyor.");
  }
  return sku;
}

/** Barcode from a request value, like `readSkuValue`. */
export function readBarcodeValue(value: unknown): string | null | undefined {
  const barcode = readText(value, PRODUCT_DETAIL_LIMITS.barcodeMax, "Barkod");
  if (barcode !== undefined && barcode !== null && !/^[0-9A-Za-z._-]+$/.test(barcode)) {
    throw new Error("Barkod yalnızca harf, rakam, nokta, tire ve alt çizgi içerebilir.");
  }
  return barcode;
}

function readNumber(
  value: unknown,
  label: string,
  { max, decimals }: { max: number; decimals: number },
): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > max) {
    throw new Error(`${label} geçersiz.`);
  }
  const factor = 10 ** decimals;
  const rounded = Math.round(n * factor) / factor;
  if (rounded <= 0) throw new Error(`${label} geçersiz.`);
  return rounded;
}

function readUnitPrice(value: unknown): TrUnitPrice | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object") {
    throw new Error("Birim fiyat geçersiz.");
  }
  const record = value as Record<string, unknown>;
  const enabled = record.enabled === true;
  const amount = readNumber(record.amount, "Birim miktarı", {
    max: UNIT_AMOUNT_MAX,
    decimals: 3,
  });
  const type = record.type ?? null;
  if (type !== null && !isUnitType(type)) {
    throw new Error("Birim türü geçersiz.");
  }
  if (enabled && (amount == null || type === null)) {
    throw new Error("Birim fiyat için miktar ve birim girin.");
  }
  return { enabled, amount: amount ?? null, type };
}

/**
 * Reads the detail fields of a create / update request body. Throws an `Error` with a
 * sentence for the owner when something is invalid.
 */
export function readProductDetailsBody(
  body: Record<string, unknown>,
): ProductDetailsBody {
  const details: ProductDetailsBody = {};

  if (body.descriptionHtml !== undefined) {
    if (body.descriptionHtml !== null && typeof body.descriptionHtml !== "string") {
      throw new Error("Açıklama geçersiz.");
    }
    if (
      typeof body.descriptionHtml === "string" &&
      body.descriptionHtml.length > RICH_TEXT_HTML_MAX_LENGTH
    ) {
      throw new Error("Açıklama çok uzun.");
    }
    details.descriptionHtml = body.descriptionHtml;
  }

  const brand = readText(body.brand, PRODUCT_DETAIL_LIMITS.brandMax, "Marka");
  if (brand !== undefined) details.brand = brand;

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) throw new Error("Etiketler geçersiz.");
    const tags = normalizeTags(
      body.tags.filter((tag): tag is string => typeof tag === "string"),
    );
    if (tags.length > PRODUCT_DETAIL_LIMITS.tagsMax) {
      throw new Error(`En fazla ${PRODUCT_DETAIL_LIMITS.tagsMax} etiket ekleyebilirsiniz.`);
    }
    if (tags.some((tag) => tag.length > PRODUCT_DETAIL_LIMITS.tagMax)) {
      throw new Error(
        `Bir etiket en fazla ${PRODUCT_DETAIL_LIMITS.tagMax} karakter olabilir.`,
      );
    }
    details.tags = tags;
  }

  const googleCategory = readText(
    body.googleCategory,
    PRODUCT_DETAIL_LIMITS.googleCategoryMax,
    "Google ürün kategorisi",
  );
  if (googleCategory !== undefined) details.googleCategory = googleCategory;

  const sku = readSkuValue(body.sku);
  if (sku !== undefined) details.sku = sku;

  const barcode = readBarcodeValue(body.barcode);
  if (barcode !== undefined) details.barcode = barcode;

  const desi = readNumber(body.desi, "Desi", {
    max: PRODUCT_DETAIL_LIMITS.desiMax,
    decimals: 2,
  });
  if (desi !== undefined) details.desi = desi;

  if (body.continueSelling !== undefined) {
    details.continueSelling = body.continueSelling === true;
  }

  const unitPrice = readUnitPrice(body.unitPrice);
  if (unitPrice !== undefined) details.unitPrice = unitPrice;

  const supplier = readText(
    body.supplier,
    PRODUCT_DETAIL_LIMITS.supplierMax,
    "Tedarikçi",
  );
  if (supplier !== undefined) details.supplier = supplier;

  const hsCode = readText(body.hsCode, PRODUCT_DETAIL_LIMITS.hsCodeMax, "HS kodu");
  if (hsCode !== undefined) {
    if (hsCode !== null && !/^\d[\d. ]{3,}$/.test(hsCode)) {
      throw new Error("HS kodu yalnızca rakam ve nokta içerebilir (en az 4 hane).");
    }
    details.hsCode = hsCode;
  }

  return details;
}
