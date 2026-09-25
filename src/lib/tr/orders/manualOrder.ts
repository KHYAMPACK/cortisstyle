/**
 * The owner-created ("manual") order, as the panel's order editor holds it and as a
 * draft stores it. Pure and client-safe: the editor, the draft API and the order API
 * all read and price it with the same code.
 *
 * The shape is deliberately small — product lines, who it is for, a reduce-only price
 * adjustment, a shipping fee, a note and whether payment was taken. Prices are never
 * part of it: they are looked up from the catalog whenever the order is priced.
 */

export const MANUAL_ORDER_LIMITS = {
  linesMax: 50,
  quantityMax: 999,
  noteMax: 1000,
  adjustmentTitleMax: 80,
  /** A shipping fee above ₺10.000 is a typo. */
  shippingMaxKurus: 1_000_000,
  /** An adjustment above ₺10.000.000 is a typo (the subtotal caps the real amount). */
  adjustmentMaxKurus: 1_000_000_000,
} as const;

export interface ManualLine {
  productId: string;
  /** The size of a product with sizes; null otherwise and for variants. */
  size: string | null;
  /** A Gelişmiş ürün's variant; null otherwise. */
  variantId: string | null;
  quantity: number;
}

/** A price reduction — increases are not offered. `title` names it on the order. */
export type ManualAdjustment =
  | { kind: "amount"; amountKurus: number; title: string }
  | { kind: "percent"; percent: number; title: string };

export type ManualPaymentChoice = "paid" | "pending";

export interface ManualOrderDraft {
  customerId: string | null;
  /** One of the customer's saved address ids. */
  addressId: string | null;
  lines: ManualLine[];
  adjustment: ManualAdjustment | null;
  shippingFeeKurus: number;
  customerNote: string;
  paymentStatus: ManualPaymentChoice;
}

export const EMPTY_MANUAL_ORDER: ManualOrderDraft = {
  customerId: null,
  addressId: null,
  lines: [],
  adjustment: null,
  shippingFeeKurus: 0,
  customerNote: "",
  paymentStatus: "pending",
};

export function manualLineKey(
  line: Pick<ManualLine, "productId" | "size" | "variantId">,
): string {
  return `${line.productId}|${line.size ?? ""}|${line.variantId ?? ""}`;
}

/** The same product / size / variant twice becomes one line with the quantities added. */
export function mergeManualLines(lines: readonly ManualLine[]): ManualLine[] {
  const merged = new Map<string, ManualLine>();
  for (const line of lines) {
    const key = manualLineKey(line);
    const existing = merged.get(key);
    if (existing) {
      existing.quantity = Math.min(
        MANUAL_ORDER_LIMITS.quantityMax,
        existing.quantity + line.quantity,
      );
    } else {
      merged.set(key, { ...line });
    }
  }
  return [...merged.values()];
}

/** What a reduction takes off `subtotalKurus`: never more than the subtotal, whole kuruş. */
export function adjustmentDiscountKurus(
  subtotalKurus: number,
  adjustment: ManualAdjustment | null,
): number {
  if (!adjustment || subtotalKurus <= 0) return 0;
  const raw =
    adjustment.kind === "amount"
      ? adjustment.amountKurus
      : Math.floor((subtotalKurus * adjustment.percent) / 100);
  return Math.max(0, Math.min(subtotalKurus, Math.floor(raw)));
}

export interface ManualTotals {
  subtotalKurus: number;
  discountKurus: number;
  shippingKurus: number;
  totalKurus: number;
}

export function computeManualTotals(args: {
  lines: ReadonlyArray<{ priceKurus: number; quantity: number }>;
  adjustment: ManualAdjustment | null;
  shippingFeeKurus: number;
}): ManualTotals {
  const subtotalKurus = args.lines.reduce(
    (sum, line) => sum + line.priceKurus * line.quantity,
    0,
  );
  const discountKurus = adjustmentDiscountKurus(subtotalKurus, args.adjustment);
  const shippingKurus = Math.max(0, Math.floor(args.shippingFeeKurus));
  return {
    subtotalKurus,
    discountKurus,
    shippingKurus,
    totalKurus: subtotalKurus - discountKurus + shippingKurus,
  };
}

function readString(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : null;
}

function readId(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function readAdjustment(value: unknown): ManualAdjustment | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const title = readString(record.title, MANUAL_ORDER_LIMITS.adjustmentTitleMax);
  if (title === null) return undefined;
  if (record.kind === "amount") {
    const amount = record.amountKurus;
    if (
      typeof amount !== "number" ||
      !Number.isInteger(amount) ||
      amount <= 0 ||
      amount > MANUAL_ORDER_LIMITS.adjustmentMaxKurus
    ) {
      return undefined;
    }
    return { kind: "amount", amountKurus: amount, title };
  }
  if (record.kind === "percent") {
    const percent = record.percent;
    if (typeof percent !== "number" || !(percent > 0) || percent > 100) return undefined;
    return { kind: "percent", percent, title };
  }
  return undefined;
}

/**
 * Reads a request or a stored draft into a `ManualOrderDraft`, or says what is wrong in
 * a sentence for the owner. Lenient about what an unfinished draft may lack (no customer
 * yet, no lines); strict about shape and limits. Quantities are whole numbers 1–999.
 */
export function readManualOrderDraft(
  raw: unknown,
): { ok: true; draft: ManualOrderDraft } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Sipariş bilgisi geçersiz." };
  }
  const record = raw as Record<string, unknown>;

  const rawLines = record.lines === undefined ? [] : record.lines;
  if (!Array.isArray(rawLines)) return { ok: false, error: "Ürün listesi geçersiz." };
  if (rawLines.length > MANUAL_ORDER_LIMITS.linesMax) {
    return {
      ok: false,
      error: `Bir siparişe en fazla ${MANUAL_ORDER_LIMITS.linesMax} kalem eklenebilir.`,
    };
  }
  const lines: ManualLine[] = [];
  for (const entry of rawLines) {
    if (!entry || typeof entry !== "object") {
      return { ok: false, error: "Ürün listesi geçersiz." };
    }
    const line = entry as Record<string, unknown>;
    const productId = readId(line.productId);
    const quantity = line.quantity;
    if (
      !productId ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MANUAL_ORDER_LIMITS.quantityMax
    ) {
      return {
        ok: false,
        error: `Ürün adedi 1–${MANUAL_ORDER_LIMITS.quantityMax} arası bir tam sayı olmalı.`,
      };
    }
    lines.push({
      productId,
      size: readId(line.size),
      variantId: readId(line.variantId),
      quantity,
    });
  }

  const adjustment = readAdjustment(record.adjustment);
  if (adjustment === undefined) {
    return { ok: false, error: "Fiyat indirimi geçersiz." };
  }

  const shipping = record.shippingFeeKurus === undefined ? 0 : record.shippingFeeKurus;
  if (
    typeof shipping !== "number" ||
    !Number.isInteger(shipping) ||
    shipping < 0 ||
    shipping > MANUAL_ORDER_LIMITS.shippingMaxKurus
  ) {
    return { ok: false, error: "Kargo tutarı geçersiz." };
  }

  const note = readString(record.customerNote, MANUAL_ORDER_LIMITS.noteMax);
  if (note === null) {
    return {
      ok: false,
      error: `Müşteri notu en fazla ${MANUAL_ORDER_LIMITS.noteMax} karakter olabilir.`,
    };
  }

  const payment = record.paymentStatus === "paid" ? "paid" : "pending";

  return {
    ok: true,
    draft: {
      customerId: readId(record.customerId),
      addressId: readId(record.addressId),
      lines: mergeManualLines(lines),
      adjustment,
      shippingFeeKurus: shipping,
      customerNote: note,
      paymentStatus: payment,
    },
  };
}

/** Why this order can't be created yet, or null when it can. */
export function manualOrderReadyError(draft: ManualOrderDraft): string | null {
  if (draft.lines.length === 0) return "Siparişe en az bir ürün ekleyin.";
  if (!draft.customerId) return "Bir müşteri seçin.";
  if (!draft.addressId) return "Teslimat adresi seçin.";
  return null;
}

/** A draft has nothing worth keeping until it has a line or a customer. */
export function isManualOrderBlank(draft: ManualOrderDraft): boolean {
  return (
    draft.lines.length === 0 &&
    !draft.customerId &&
    !draft.adjustment &&
    draft.shippingFeeKurus === 0 &&
    draft.customerNote.trim() === ""
  );
}

/** The two drafts hold the same order (for the editor's unsaved-changes check). */
export function sameManualOrder(a: ManualOrderDraft, b: ManualOrderDraft): boolean {
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

function normalize(draft: ManualOrderDraft) {
  return {
    ...draft,
    customerNote: draft.customerNote.trim(),
    lines: draft.lines.map((line) => ({ ...line })),
  };
}
