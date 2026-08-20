import { flattenCutoutToStorefrontWebp } from "@/lib/tr/assets/flattenCutoutToStorefront";
import { uploadTrProductAsset } from "@/lib/tr/trAssetStorage";
import { parseTrAssetUrlParts } from "@/lib/tr/trAssetUrls";

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Storefront kaynağı indirilemedi (${response.status}).`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Leftover helper: flatten marketplace PNGs onto catalog background and
 * upload opaque WebP copies (kind: storefront). Not called on save.
 * Cadde and boutique both keep the PNG URLs.
 */
export async function buildStorefrontImageUrls(params: {
  marketplaceUrls: string[];
  backgroundId: string | null | undefined;
  userId: string;
  boutiqueId: string;
}): Promise<string[]> {
  const urls: string[] = [];
  for (const raw of params.marketplaceUrls) {
    const marketplaceUrl = raw.trim();
    if (!marketplaceUrl) {
      urls.push("");
      continue;
    }
    try {
      const parsed = parseTrAssetUrlParts(marketplaceUrl);
      const cutout = await fetchImageBuffer(marketplaceUrl);
      const encoded = await flattenCutoutToStorefrontWebp({
        cutout,
        backgroundId: params.backgroundId,
      });
      const uploaded = await uploadTrProductAsset({
        userId: parsed?.userId || params.userId,
        boutiqueId: parsed?.boutiqueId || params.boutiqueId,
        bytes: encoded.bytes,
        contentType: encoded.contentType,
        kind: "storefront",
        fileId: parsed?.fileId,
        upsert: Boolean(parsed?.fileId),
      });
      urls.push(`${uploaded.url}?v=${Date.now()}`);
    } catch (error) {
      console.warn("[storefront] flatten skipped:", marketplaceUrl, error);
      urls.push("");
    }
  }
  return urls;
}
