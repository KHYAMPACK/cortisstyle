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



/** Prefer boutique custom domain → info@host; else platform mailbox. */

export function resolveBoutiqueContactEmail(boutique: {

  customDomain?: string | null;

}): string {

  const host = boutique.customDomain

    ?.trim()

    .toLowerCase()

    .replace(/^www\./, "");

  if (host && host.includes(".")) {

    return `info@${host}`;

  }

  return "info@cortisstyle.com";

}


