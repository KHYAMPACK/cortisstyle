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

export function generateIssueSerial(lookId: string, buyerName: string): string {
  let hash = 0;
  const input = `${lookId}:${buyerName.trim().toLowerCase()}`;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 1000;
  }

  return `${String(hash).padStart(4, "0")} / 1000`;
}

export function formatPurchaseDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatLedgerTimestamp(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(date)
    .toUpperCase();
}
