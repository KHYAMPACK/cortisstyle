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
};

/** Default apparel parcel until owner can set desi. */
export const DEFAULT_APPAREL_PACKAGE = {
  height: 10,
  width: 15,
  depth: 5,
  weight: 1,
} as const;
