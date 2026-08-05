import { getServiceSupabase } from "@/lib/supabaseAdmin";
import type { StudioImportPipeline } from "@/types/studioImportCache";

export const STUDIO_ASSETS_BUCKET = "studio-assets";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
}

export function buildStudioAssetPath(
  userId: string,
  draftId: string | null,
  itemId: string,
  extension = "png",
): string {
  const folder = draftId ? sanitizeSegment(draftId) : "scratch";
  const fileName = `${sanitizeSegment(itemId)}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  return `${sanitizeSegment(userId)}/${folder}/${fileName}`;
}

export function buildStudioLibraryAssetPath(
  userId: string,
  sourceHash: string,
  pipeline: StudioImportPipeline,
  extension = "png",
): string {
  return `${sanitizeSegment(userId)}/library/${sourceHash}-${pipeline}.${extension}`;
}

export function getStudioAssetPublicUrl(storagePath: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  return `${url.replace(/\/$/, "")}/storage/v1/object/public/${STUDIO_ASSETS_BUCKET}/${storagePath}`;
}

export async function uploadStudioAsset(params: {
  userId: string;
  draftId?: string | null;
  itemId: string;
  bytes: Buffer;
  contentType: string;
  library?: {
    sourceHash: string;
    pipeline: StudioImportPipeline;
  };
}): Promise<{ url: string; path: string }> {
  const admin = getServiceSupabase();

  if (!admin) {
    throw new Error(
      "Studio asset upload is not configured. Add SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (params.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("File exceeds the 12 MB upload limit.");
  }

  const extension = params.contentType.includes("jpeg") ? "jpg" : "png";
  const path = params.library
    ? buildStudioLibraryAssetPath(
        params.userId,
        params.library.sourceHash,
        params.library.pipeline,
        extension,
      )
    : buildStudioAssetPath(
        params.userId,
        params.draftId ?? null,
        params.itemId,
        extension,
      );

  const { error } = await admin.storage
    .from(STUDIO_ASSETS_BUCKET)
    .upload(path, params.bytes, {
      contentType: params.contentType,
      upsert: Boolean(params.library),
    });

  if (error) {
    throw error;
  }

  return {
    path,
    url: getStudioAssetPublicUrl(path),
  };
}
