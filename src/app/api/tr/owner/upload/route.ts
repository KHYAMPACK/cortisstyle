import {
  encodeOpaqueWebp,
  ORIGINAL_MAX_EDGE_PX,
} from "@/lib/tr/assets/encodeOpaqueImage";
import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { uploadTrProductAsset } from "@/lib/tr/trAssetStorage";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/**
 * POST /api/tr/owner/upload
 * multipart: file + boutiqueId. Stores the photo (WebP, capped edge) and returns its URL.
 * (Background removal for marketplace cutouts was part of the AI pipeline, parked in
 * docs/ai-pipeline-v1.md.)
 */
export async function POST(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Geçersiz form verisi." }, { status: 400 });
  }

  const boutiqueIdRaw = formData.get("boutiqueId");
  const boutiqueId =
    typeof boutiqueIdRaw === "string" ? boutiqueIdRaw.trim() : "";

  if (!boutiqueId) {
    return Response.json({ error: "boutiqueId zorunlu." }, { status: 400 });
  }

  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Dosya gerekli." }, { status: 400 });
  }

  const contentType = file.type || "image/jpeg";
  if (!ALLOWED_TYPES.has(contentType)) {
    return Response.json(
      { error: "Yalnızca PNG, JPEG ve WebP yükleyebilirsiniz." },
      { status: 400 },
    );
  }

  try {
    const rawBytes = Buffer.from(await file.arrayBuffer());
    const originalEncoded = await encodeOpaqueWebp(
      rawBytes,
      ORIGINAL_MAX_EDGE_PX,
    );
    const original = await uploadTrProductAsset({
      userId: authResult.auth.user.id,
      boutiqueId: boutique.id,
      bytes: originalEncoded.bytes,
      contentType: originalEncoded.contentType,
      kind: "original",
    });

    return Response.json({ url: original.url, path: original.path });
  } catch (error) {
    console.error("[tr/owner/upload] failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Fotoğraf yüklenemedi.",
      },
      { status: 500 },
    );
  }
}
