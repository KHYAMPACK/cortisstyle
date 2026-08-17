export {
  boutiqueHasLiveShipping,
  getShippingProviderId,
  type TrShippingProviderId,
} from "@/lib/tr/shipping/registry";
export {
  CHECKOUT_SHIPPING_HANDLER,
  DEFAULT_APPAREL_PACKAGE,
  EMPTY_ORDER_SHIPMENT,
  type TrOrderShipment,
  type TrShippingRate,
  type TrShippingTrace,
} from "@/lib/tr/shipping/types";
export {
  LIVE_TRACKING_STEPS,
  fulfillmentFromProviderStatus,
  trackingStepFromProviderStatus,
} from "@/lib/tr/shipping/mapFulfillment";
