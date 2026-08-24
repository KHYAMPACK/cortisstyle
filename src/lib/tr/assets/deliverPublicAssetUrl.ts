import { isTrAssetUrl } from "@/lib/tr/assets/trAssetUrls";

/**
 * Display-time asset delivery. DB and uploads always store Supabase public
 * URLs. This helper is the only place to point browsers at a later CDN or
 * PLP thumb without migrating rows.
 */
export type AssetDeliveryRole = "full" | "plp";

function assetCdnOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_ASSET_CDN_ORIGIN?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

/**
 * @param role Reserved for PLP thumbs. Ignored until a sibling display file exists.
 */
export function deliverPublicAssetUrl(
  src: string,
  role: AssetDeliveryRole = "full",
): string {
  void role;
  const origin = assetCdnOrigin();
  if (!origin || !isTrAssetUrl(src)) return src;

  try {
    const url = new URL(src);
    const cdn = new URL(origin);
    url.protocol = cdn.protocol;
    url.host = cdn.host;
    return url.toString();
  } catch {
    return src;
  }
}

export function deliverPublicAssetUrls(
  urls: string[],
  role: AssetDeliveryRole = "full",
): string[] {
  return urls.map((url) => deliverPublicAssetUrl(url, role));
}
