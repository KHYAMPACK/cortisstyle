/** Client-safe helpers for TR product asset URLs (no Node built-ins). */

export const TR_ASSETS_BUCKET = "tr-assets";

export function isTrMarketplaceAssetUrl(src: string | null | undefined): boolean {
  if (!src) return false;
  return src.includes(`/${TR_ASSETS_BUCKET}/`) && src.includes("/marketplace/");
}

export function isTrAssetUrl(src: string | null | undefined): boolean {
  if (!src) return false;
  return src.includes(`/storage/v1/object/public/${TR_ASSETS_BUCKET}/`);
}

export function isTrStorefrontAssetUrl(src: string | null | undefined): boolean {
  if (!src) return false;
  return src.includes(`/${TR_ASSETS_BUCKET}/`) && src.includes("/storefront/");
}

export type TrAssetUrlParts = {
  userId: string;
  boutiqueId: string;
  kind: string;
  fileId: string;
  extension: string;
};

const TR_ASSET_PATH =
  /\/tr-assets\/([^/]+)\/([^/]+)\/(original|marketplace|lifestyle|storefront)\/([^/?#]+)/i;

/** Parse `tr-assets/{userId}/{boutiqueId}/{kind}/{fileId}.ext` from a public URL. */
export function parseTrAssetUrlParts(
  src: string | null | undefined,
): TrAssetUrlParts | null {
  if (!src) return null;
  const match = src.match(TR_ASSET_PATH);
  if (!match) return null;
  const fileName = match[4] ?? "";
  const dot = fileName.lastIndexOf(".");
  const fileId = dot > 0 ? fileName.slice(0, dot) : fileName;
  const extension = dot > 0 ? fileName.slice(dot + 1) : "";
  if (!fileId) return null;
  return {
    userId: decodeURIComponent(match[1] ?? ""),
    boutiqueId: decodeURIComponent(match[2] ?? ""),
    kind: match[3] ?? "",
    fileId,
    extension,
  };
}
