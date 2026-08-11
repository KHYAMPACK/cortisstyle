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
 * True only when iyzico (or equivalent) card capture is actually live.
 * Do not infer this from TR_CHECKOUT_ENABLED — that only means checkout accepts orders.
 */
export function isTrIyzicoCaptureEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_TR_IYZICO_ENABLED?.trim().toLowerCase() === "true"
  );
}

/** Explicit storefront contact emails (overrides info@{customDomain}). */
const CONTACT_EMAIL_BY_SLUG: Partial<Record<string, string>> = {
  lilabutik: "ncp20@outlook.com",
};

/** Prefer slug override → custom domain info@host → platform mailbox. */
export function resolveBoutiqueContactEmail(boutique: {
  slug?: string;
  customDomain?: string | null;
}): string {
  const slug = boutique.slug?.trim().toLowerCase();
  if (slug) {
    const override = CONTACT_EMAIL_BY_SLUG[slug];
    if (override) return override;
  }

  const host = boutique.customDomain
    ?.trim()
    .toLowerCase()
    .replace(/^www\./, "");

  if (host && host.includes(".")) {
    return `info@${host}`;
  }

  return "info@cortisstyle.com";
}
