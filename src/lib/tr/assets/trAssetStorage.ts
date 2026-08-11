import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { TR_ASSETS_BUCKET } from "@/lib/tr/trAssetUrls";

export { TR_ASSETS_BUCKET, isTrMarketplaceAssetUrl } from "@/lib/tr/trAssetUrls";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type TrAssetKind = "original" | "marketplace" | "lifestyle";

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
}

function extensionFromContentType(contentType: string): string {
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  return "png";
}

export function buildTrAssetPath(
  userId: string,
  boutiqueId: string,
  contentType: string,
  kind: TrAssetKind = "original",
): string {
  const extension = extensionFromContentType(contentType);
  const fileName = `${crypto.randomUUID()}.${extension}`;
  return `${sanitizeSegment(userId)}/${sanitizeSegment(boutiqueId)}/${kind}/${fileName}`;
}

export function getTrAssetPublicUrl(storagePath: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  return `${url.replace(/\/$/, "")}/storage/v1/object/public/${TR_ASSETS_BUCKET}/${storagePath}`;
}

export async function uploadTrProductAsset(params: {
  userId: string;
  boutiqueId: string;
  bytes: Buffer;
  contentType: string;
  kind?: TrAssetKind;
}): Promise<{ url: string; path: string }> {
  const admin = getServiceSupabase();

  if (!admin) {
    throw new Error(
      "TR asset upload is not configured. Add SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (params.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("Dosya 10 MB sınırını aşıyor.");
  }

  const kind = params.kind ?? "original";
  const path = buildTrAssetPath(
    params.userId,
    params.boutiqueId,
    params.contentType,
    kind,
  );

  const { error } = await admin.storage
    .from(TR_ASSETS_BUCKET)
    .upload(path, params.bytes, {
      contentType: params.contentType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return {
    path,
    url: getTrAssetPublicUrl(path),
  };
}
