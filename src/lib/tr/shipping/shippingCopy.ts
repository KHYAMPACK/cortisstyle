import type {
  FreeShippingProgress,
  ShippingFeeConfig,
} from "@/lib/tr/shipping/quoteShipping";

/** "120 TL", "89,90 TL" — whole lira without decimals. */
export function tlLabel(kurus: number): string {
  const safe = Math.max(0, Math.round(kurus));
  const lira = Math.floor(safe / 100);
  const rest = safe % 100;
  return rest === 0
    ? `${lira} TL`
    : `${lira},${String(rest).padStart(2, "0")} TL`;
}

/** "2 ürün ve üzeri kargo ücretsiz". Null when there is no free threshold. */
export function freeShippingPromoCopy(config: ShippingFeeConfig): string | null {
  if (config.feeKurus <= 0) return null;
  if (config.freeMinItems !== null) {
    return `${config.freeMinItems} ürün ve üzeri kargo ücretsiz`;
  }
  if (config.freeMinSubtotalKurus !== null) {
    return `${tlLabel(config.freeMinSubtotalKurus)} ve üzeri kargo ücretsiz`;
  }
  return null;
}

/** Homepage info-strip body. Null when the boutique charges no shipping. */
export function shippingHomeBody(config: ShippingFeeConfig): string | null {
  if (config.feeKurus <= 0) return null;
  const fee = tlLabel(config.feeKurus);
  const promo = freeShippingPromoCopy(config);
  if (!promo) return `Kargo ücreti ${fee}. Türkiye geneline gönderim.`;
  const below =
    config.freeMinItems === 2 ? "Tek üründe" : "Altındaki siparişlerde";
  return `${promo}. ${below} ${fee}. Türkiye geneline gönderim.`;
}

/** Cart / checkout nudge line under the fee. */
export function freeShippingNudgeDetail(progress: FreeShippingProgress): string {
  if (progress.unit === "amount") {
    return `${tlLabel(progress.remaining)} daha ekle, kargo bedava`;
  }
  return progress.remaining === 1
    ? "1 ürün daha ekle, kargo bedava"
    : `${progress.remaining} ürüne tamamla, kargo bedava`;
}
