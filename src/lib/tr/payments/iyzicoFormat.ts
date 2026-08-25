/** Match iyzipay-node `utils.formatPrice`. */
export function formatIyzicoPrice(kurus: number): string {
  const value = Math.max(0, Math.round(kurus)) / 100;
  const asString = parseFloat(value.toFixed(2)).toString();
  return asString.includes(".") ? asString : `${asString}.0`;
}

export function splitBuyerName(fullName: string): { name: string; surname: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { name: "Musteri", surname: "Musteri" };
  if (parts.length === 1) return { name: parts[0]!, surname: parts[0]! };
  return { name: parts[0]!, surname: parts.slice(1).join(" ") };
}

/** iyzico Checkout Form typically wants +90 + 10 digits. */
export function formatIyzicoGsm(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  let national = digits;
  if (national.startsWith("90") && national.length >= 12) {
    national = national.slice(2);
  } else if (national.startsWith("0") && national.length >= 11) {
    national = national.slice(1);
  }
  national = national.slice(-10).padStart(10, "5");
  return `+90${national}`;
}

/**
 * Bireysel checkout no longer collects TCKN. iyzico still expects 11 digits.
 * Live may reject this fallback — confirm on the first real charge.
 */
export const IYZICO_IDENTITY_FALLBACK = "11111111111";

export function ipv4ForIyzico(ip: string): string {
  const mapped = ip.match(/::ffff:(\d{1,3}(?:\.\d{1,3}){3})/i);
  if (mapped?.[1]) return mapped[1];
  const v4 = ip.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  if (v4?.[0] && v4[0] !== "127.0.0.1") return v4[0];
  return "85.34.78.112";
}

export function iyzicoTextId(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  return "";
}

/**
 * Checkout Form retrieve echoes `conversationId` from the retrieve request,
 * not from initialize. The order UUID lives on `basketId` (and our callback
 * `?order=` query) after pay.
 */
export function resolveIyzicoCallbackOrderId(input: {
  orderFromQuery?: string;
  conversationFromCallback?: string;
  retrieve?: {
    basketId?: unknown;
    conversationId?: unknown;
  };
}): string {
  return (
    iyzicoTextId(input.retrieve?.basketId) ||
    iyzicoTextId(input.orderFromQuery) ||
    iyzicoTextId(input.retrieve?.conversationId) ||
    iyzicoTextId(input.conversationFromCallback)
  );
}

function iyzicoPaidPriceKurus(
  paidPrice: string | number | undefined,
): number | null {
  if (paidPrice == null || paidPrice === "") return null;
  const value = typeof paidPrice === "number" ? paidPrice : parseFloat(paidPrice);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

export function iyzicoPaymentMatchesOrder(
  order: { id: string; totalKurus: number },
  retrieve: {
    paymentStatus?: string;
    paymentId?: string | number;
    conversationId?: string;
    basketId?: string;
    paidPrice?: string | number;
    currency?: string;
    mdStatus?: string | number;
  },
): string | null {
  if (retrieve.paymentStatus !== "SUCCESS") {
    return "Ödeme tamamlanmadı.";
  }
  const paymentId = String(retrieve.paymentId ?? "").trim();
  if (!paymentId) return "Ödeme numarası yok.";
  const basketId = iyzicoTextId(retrieve.basketId);
  if (basketId && basketId !== order.id) {
    return "Sipariş eşleşmedi.";
  }
  if (
    retrieve.currency &&
    String(retrieve.currency).toUpperCase() !== "TRY"
  ) {
    return "Para birimi geçersiz.";
  }
  if (retrieve.mdStatus != null && String(retrieve.mdStatus) !== "1") {
    return "3D Secure doğrulanmadı.";
  }
  const paidKurus = iyzicoPaidPriceKurus(retrieve.paidPrice);
  if (paidKurus != null && Math.abs(paidKurus - order.totalKurus) > 1) {
    return "Ödenen tutar siparişle uyuşmuyor.";
  }
  return null;
}

export function truncateIyzicoText(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max);
}
