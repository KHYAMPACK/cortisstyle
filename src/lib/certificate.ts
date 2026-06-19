export function generateCertificateSerial(
  lookId: string,
  buyerName: string,
  dateOfPurchase: string,
): string {
  const buyerSlug = buyerName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 16);

  const dateSlug = dateOfPurchase.replace(/[^0-9]/g, "").slice(0, 8);
  const lookSlug = lookId.toUpperCase().replace(/[^A-Z0-9-]+/g, "-");

  return `CORTIS-${lookSlug}-${buyerSlug || "CURATOR"}-${dateSlug}`;
}

export function formatPurchaseDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}
