import {
  uploadTrProductAsset,
  type TrAssetKind,
} from "@/lib/tr/trAssetStorage";

/**
 * Download a remote image (e.g. FASHN CDN, expires ~3 days) and store in tr-assets.
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
  const buffer = Buffer.from(await response.arrayBuffer());

  return uploadTrProductAsset({
    userId: params.userId,
    boutiqueId: params.boutiqueId,
    bytes: buffer,
    contentType,
    kind: params.kind,
  });
}
