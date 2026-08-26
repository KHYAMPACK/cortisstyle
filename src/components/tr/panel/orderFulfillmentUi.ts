import type {
  TrFulfillmentStatus,
  TrPaymentStatus,
} from "@/types/tr-marketplace";

/** Short status chip on list + detail. */
export const FULFILLMENT_LABEL: Record<TrFulfillmentStatus, string> = {
  created: "Yeni sipariş",
  ready: "Kargoya hazır",
  shipped: "Kargoda",
  delivered: "Teslim edildi",
  cancelled: "İptal",
};

/** What the boutique owner should do next. */
export const FULFILLMENT_HINT: Record<TrFulfillmentStatus, string> = {
  created: "Ürünü paketleyin, sonra “Kargoya hazır” seçin.",
  ready: "Kargo firmanızdan gönderi oluşturun; panel entegrasyonu yakında.",
  shipped: "Kargo yolda — müşteriye ulaşınca “Teslim edildi” yapın.",
  delivered: "Bu sipariş tamamlandı.",
  cancelled: "İptal edildi; stok otomatik geri yüklendi.",
};

/** Live Basit kargo — etiket is the next step, not the manual status chip. */
export function fulfillmentHintForBoutique(
  status: TrFulfillmentStatus,
  liveShipping: boolean,
): string {
  if (liveShipping) {
    if (status === "created") {
      return "Ödeme sonrası etiket otomatik üretilir. Yoksa “Etiket hazırla” ile tekrar deneyin.";
    }
    if (status === "ready") {
      return "Etiket hazır. Yazdırın ve paketi kargo şubesine bırakın.";
    }
  }
  return FULFILLMENT_HINT[status];
}

export const FULFILLMENT_TONE: Record<TrFulfillmentStatus, string> = {
  created: "bg-amber-50 text-amber-950",
  ready: "bg-sky-50 text-sky-950",
  shipped: "bg-violet-50 text-violet-950",
  delivered: "bg-emerald-50 text-emerald-950",
  cancelled: "bg-neutral-100 text-neutral-600",
};

export const PAYMENT_LABEL: Record<TrPaymentStatus, string> = {
  sandbox: "Deneme ödeme",
  pending: "Ödeme bekleniyor",
  paid: "Ödendi",
  failed: "Ödeme başarısız",
  refunded: "İade edildi",
};

export const FULFILLMENT_FILTERS: Array<"all" | TrFulfillmentStatus> = [
  "all",
  "created",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
];

/** Happy-path next status from the list card. */
export const FULFILLMENT_NEXT: Partial<
  Record<TrFulfillmentStatus, TrFulfillmentStatus>
> = {
  created: "ready",
  ready: "shipped",
  shipped: "delivered",
};

export const FULFILLMENT_NEXT_LABEL: Partial<
  Record<TrFulfillmentStatus, string>
> = {
  created: "Kargoya hazır",
  ready: "Kargoda",
  shipped: "Teslim edildi",
};

export function formatOrderDateShort(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatOrderDateLong(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}
