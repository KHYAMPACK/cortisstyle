import {
  encodeOpaqueWebp,
  ORIGINAL_MAX_EDGE_PX,
} from "@/lib/tr/assets/encodeOpaqueImage";
import {
  uploadTrProductAsset,
  type TrAssetKind,
} from "@/lib/tr/trAssetStorage";

/**
 * Download a remote image (e.g. FASHN CDN, expires ~3 days) and store in tr-assets.
 * Lifestyle shots are opaque photos — encode WebP. Marketplace cutouts stay PNG.
 */
export async function rehostRemoteImageToTrAssets(params: {
  imageUrl: string;
  userId: string;
  boutiqueId: string;
  kind: TrAssetKind;
}): Promise<{ url: string; path: string }> {
  const response = await fetch(params.imageUrl);
  if (!response.ok) {
    throw new Error(
      `Görsel indirilemedi (${response.status}). FASHN çıktısı alınamadı.`,
    );
  }

  const contentType =
    response.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  const raw = Buffer.from(await response.arrayBuffer());
  const encoded =
    params.kind === "lifestyle"
      ? await encodeOpaqueWebp(raw, ORIGINAL_MAX_EDGE_PX)
      : { bytes: raw, contentType };

  return uploadTrProductAsset({
    userId: params.userId,
    boutiqueId: params.boutiqueId,
    bytes: encoded.bytes,
    contentType: encoded.contentType,
    kind: params.kind,
  });
}
