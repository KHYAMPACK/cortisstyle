import type {
  TrOrderShipment,
  TrShippingTrace,
} from "@/types/tr-marketplace";

export type { TrOrderShipment, TrShippingTrace };

export type TrShippingRate = {
  handlerCode: string;
  handlerName: string;
  feeKurus: number;
  durationDays: number | null;
  pickupAddress: string | null;
};

export const EMPTY_ORDER_SHIPMENT: TrOrderShipment = {
  provider: null,
  externalId: null,
  barcode: null,
  carrierCode: null,
  carrierName: null,
  trackingCode: null,
  status: null,
  traces: [],
  feeKurus: null,
  block: null,
  addressRetryUsed: false,
  lastError: null,
};

/** Default apparel parcel until owner can set desi. */
export const DEFAULT_APPAREL_PACKAGE = {
  height: 10,
  width: 15,
  depth: 5,
  weight: 1,
} as const;

/** What the shopper is charged at checkout (Lila). Server-set only. */
export const FLAT_SHIPPING_FEE_KURUS = 12_000;

/**
 * PDP free-shipping threshold copy. Checkout does not apply this yet —
 * wire cart/quote to the same constant when that ships.
 */
export const FREE_SHIPPING_THRESHOLD_KURUS = 350_000;

/** Auto-buy may debit Lila up to charged fee + 20 TL buffer. */
export const AUTO_BUY_FEE_CAP_KURUS = FLAT_SHIPPING_FEE_KURUS + 2_000;

export const SHIPPING_BLOCK_ADDRESS_REJECTED = "address_rejected" as const;
export const SHIPPING_BLOCK_INSUFFICIENT_BALANCE =
  "insufficient_balance" as const;
export const SHIPPING_BLOCK_PROVIDER_ERROR = "provider_error" as const;

export type TrShippingBlock =
  | typeof SHIPPING_BLOCK_ADDRESS_REJECTED
  | typeof SHIPPING_BLOCK_INSUFFICIENT_BALANCE
  | typeof SHIPPING_BLOCK_PROVIDER_ERROR;

/** Checkout meta-code; waterfall uses real handler codes from the fee list. */
export const CHECKOUT_SHIPPING_HANDLER = "ECONOMIC" as const;

export function isYurticiHandler(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  return (
    normalized === "YURTICI" ||
    normalized.startsWith("YURTICI") ||
    normalized === "YK" ||
    normalized === "YKMP"
  );
}

export function isEligibleAutoBuyRate(
  rate: TrShippingRate,
  capKurus: number = AUTO_BUY_FEE_CAP_KURUS,
): boolean {
  const code = rate.handlerCode.trim().toUpperCase();
  if (!code || code.startsWith("SELF_")) return false;
  if (code === CHECKOUT_SHIPPING_HANDLER || code === "FAST") return false;
  if (isYurticiHandler(code)) return false;
  if (rate.feeKurus <= 0 || rate.feeKurus > capKurus) return false;
  return true;
}
