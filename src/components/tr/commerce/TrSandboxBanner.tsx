"use client";

import {
  isTrCheckoutSandboxMode,
  isTrIyzicoCaptureEnabled,
} from "@/lib/tr/checkoutMode";
import { isTrDemoProductId } from "@/lib/tr/looks/demoCatalog";
import { boutiqueOffersIyzicoCheckout } from "@/lib/tr/payments/registry";

interface TrSandboxBannerProps {
  className?: string;
  /** Force demo-SKU copy (e.g. demo PDP). */
  demo?: boolean;
  /** Hide “kart yakında” when this boutique has live iyzico Checkout Form. */
  boutiqueSlug?: string | null;
}

/**
 * Honest status for checkout readiness.
 * Hidden only when iyzico capture is enabled and not in sandbox mode.
 */
export function TrSandboxBanner({
  className = "",
  demo = false,
  boutiqueSlug = null,
}: TrSandboxBannerProps) {
  const sandbox = isTrCheckoutSandboxMode();
  const boutiqueCardLive = boutiqueOffersIyzicoCheckout(boutiqueSlug);
  const cardPayLive =
    !sandbox && (isTrIyzicoCaptureEnabled() || boutiqueCardLive);

  if (!demo && cardPayLive) {
    return null;
  }

  let message: string;
  if (demo) {
    message =
      "Demo ürün — gerçek sipariş oluşturulmaz. Yalnızca vitrin deneyimi.";
  } else if (sandbox) {
    message =
      "Deneme modu — siparişler sandbox kaydı olarak oluşur, kart çekimi yok.";
  } else {
    message =
      "Kart ödemesi (iyzico) yakında. Siparişiniz kaydedilir; ödeme onayı sonrası kargoya çıkar.";
  }

  return (
    <div
      className={`border border-blueprint-border bg-blueprint-surface px-4 py-3 text-[11px] leading-relaxed text-meta ${className}`}
      role="status"
    >
      {message}
    </div>
  );
}

/** Client helper: cart has any demo line items. */
export function cartHasDemoItems(
  items: Array<{ productId: string }>,
): boolean {
  return items.some(
    (item) =>
      isTrDemoProductId(item.productId) ||
      item.productId.startsWith("demo-wl-"),
  );
}
