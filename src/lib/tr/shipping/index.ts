export {
  boutiqueHasLiveShipping,
  getShippingProviderId,
  type TrShippingProviderId,
} from "@/lib/tr/shipping/registry";
export {
  AUTO_BUY_FEE_CAP_KURUS,
  CHECKOUT_SHIPPING_HANDLER,
  DEFAULT_APPAREL_PACKAGE,
  EMPTY_ORDER_SHIPMENT,
  FLAT_SHIPPING_FEE_KURUS,
  SHIPPING_BLOCK_ADDRESS_REJECTED,
  SHIPPING_BLOCK_INSUFFICIENT_BALANCE,
  SHIPPING_BLOCK_PROVIDER_ERROR,
  type TrOrderShipment,
  type TrShippingBlock,
  type TrShippingRate,
  type TrShippingTrace,
} from "@/lib/tr/shipping/types";
export {
  LIVE_TRACKING_STEPS,
  fulfillmentFromProviderStatus,
  trackingStepFromProviderStatus,
} from "@/lib/tr/shipping/mapFulfillment";
