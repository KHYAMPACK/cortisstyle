import {
  FLAT_SHIPPING_FEE_KURUS,
  FREE_SHIPPING_THRESHOLD_KURUS,
} from "@/lib/tr/shipping/types";

export type TrPdpDeliverySummary = {
  methodLabel: string;
  feeLabel: string;
  freeNote: string;
};

function tryLabel(kurus: number): string {
  return `${Math.round(kurus / 100)} TL`;
}

/**
 * PDP “Teslimat ve Kolay İade” shipping lines.
 * Boutique iade policy merge comes later — keep this aligned with
 * `FLAT_SHIPPING_FEE_KURUS` / `FREE_SHIPPING_THRESHOLD_KURUS`.
 */
export function getPdpDeliverySummary(): TrPdpDeliverySummary {
  return {
    methodLabel: "Standart Teslimat",
    feeLabel: tryLabel(FLAT_SHIPPING_FEE_KURUS),
    freeNote: `${tryLabel(FREE_SHIPPING_THRESHOLD_KURUS)} ve üzeri alışverişlerinizde kargo ücretsiz.`,
  };
}
