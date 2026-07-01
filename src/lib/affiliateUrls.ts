/** Detect Amazon Associates URLs for required on-page disclosure. */
export function isAmazonAffiliateUrl(url: string): boolean {
  if (!url?.trim()) return false;

  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === "amzn.to" || host === "amzn.eu") return true;
    if (host === "amazon.com" || host.endsWith(".amazon.com")) return true;
    return /\.amazon\./.test(host);
  } catch {
    return false;
  }
}

export function itemsIncludeAmazonLink(
  items: ReadonlyArray<{ shopUrl?: string; budgetAlternativeUrl?: string }>,
): boolean {
  return items.some(
    (item) =>
      isAmazonAffiliateUrl(item.shopUrl ?? "") ||
      isAmazonAffiliateUrl(item.budgetAlternativeUrl ?? ""),
  );
}
