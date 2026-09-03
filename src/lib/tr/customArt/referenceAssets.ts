import { TR_ASSETS_BUCKET } from "@/lib/tr/trAssetUrls";

/** Storage prefix for customer reference uploads (print-on-demand). */
export const CUSTOMER_REFERENCE_ASSET_KIND = "customer-references" as const;

export function buildCustomerReferenceAssetPath(
  boutiqueId: string,
  contentType: string,
  fileId?: string,
): string {
  const extension = contentType.includes("jpeg") || contentType.includes("jpg")
    ? "jpg"
    : contentType.includes("webp")
      ? "webp"
      : "png";
  const safeBoutique = boutiqueId.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 120);
  const name = (fileId?.trim() || crypto.randomUUID()).replace(
    /[^a-zA-Z0-9-]/g,
    "-",
  );
  return `${CUSTOMER_REFERENCE_ASSET_KIND}/${safeBoutique}/${name}.${extension}`;
}

export function isCustomerReferenceAssetUrl(
  url: string,
  boutiqueId: string,
): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  const safeBoutique = boutiqueId.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 120);
  const needle = `/${TR_ASSETS_BUCKET}/${CUSTOMER_REFERENCE_ASSET_KIND}/${safeBoutique}/`;
  return trimmed.includes(needle);
}
