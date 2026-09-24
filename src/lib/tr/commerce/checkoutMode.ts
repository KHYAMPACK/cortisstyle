/**
 * Checkout / payment mode helpers for boutique go-live.
 */

/** Staging deneme siparişleri (`payment_status: sandbox`). Default off. */
export function isTrCheckoutSandboxMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_TR_CHECKOUT_SANDBOX?.trim().toLowerCase() === "true"
  );
}

/**
 * True only when the global iyzico flag is on (all tenants).
 * Lila card capture is registry-gated via `boutiqueOffersIyzicoCheckout`
 * even when this stays false — flip the flag after a live test charge.
 */
export function isTrIyzicoCaptureEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_TR_IYZICO_ENABLED?.trim().toLowerCase() === "true"
  );
}

/** Prefer DB contact email → custom domain info@host → platform mailbox. */
export function resolveBoutiqueContactEmail(boutique: {
  contactEmail?: string | null;
  customDomain?: string | null;
}): string {
  const override = boutique.contactEmail?.trim();
  if (override) return override;

  const host = boutique.customDomain
    ?.trim()
    .toLowerCase()
    .replace(/^www\./, "");

  if (host && host.includes(".")) {
    return `info@${host}`;
  }

  return "info@cortisstyle.com";
}
