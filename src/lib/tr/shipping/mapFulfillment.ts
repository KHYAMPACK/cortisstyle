import type { TrFulfillmentStatus } from "@/types/tr-marketplace";

/** Map Basit Kargo status → panel fulfillment. Never un-cancel. */
export function fulfillmentFromProviderStatus(
  current: TrFulfillmentStatus,
  providerStatus: string | null | undefined,
): TrFulfillmentStatus {
  if (current === "cancelled") return "cancelled";
  const status = (providerStatus ?? "").trim().toUpperCase();
  switch (status) {
    case "READY_TO_SHIP":
      return "ready";
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
    case "DELAYED":
    case "NEEDS_SUPPORT":
    case "RETURNING":
    case "RETURNED":
    case "LOST":
      return "shipped";
    case "DELIVERED":
      return "delivered";
    default:
      return current;
  }
}

export function trackingStepFromProviderStatus(
  providerStatus: string | null | undefined,
): number {
  const status = (providerStatus ?? "").trim().toUpperCase();
  if (status === "DELIVERED") return 3;
  if (status === "OUT_FOR_DELIVERY") return 2;
  if (
    status === "SHIPPED" ||
    status === "DELAYED" ||
    status === "NEEDS_SUPPORT" ||
    status === "RETURNING" ||
    status === "RETURNED" ||
    status === "LOST"
  ) {
    return 1;
  }
  if (status === "READY_TO_SHIP") return 0;
  return -1;
}

export const LIVE_TRACKING_STEPS = [
  "Kargoya verildi",
  "Yolda",
  "Dağıtımda",
  "Teslim edildi",
] as const;
