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
