/** Platform-wide TR marketplace checkout — not per-boutique. */
export function isTrCheckoutEnabled(): boolean {
  return process.env.TR_CHECKOUT_ENABLED?.trim().toLowerCase() === "true";
}
