import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import {
  isTrProductImageNormalizeEnabled,
  normalizeProductCutoutToCanvas,
} from "@/lib/tr/normalizeProductImage";
import {
  isPhotoroomConfigured,
  removeGarmentBackground,
} from "@/lib/studioRemoveBg";
import { uploadTrProductAsset } from "@/lib/tr/trAssetStorage";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export type TrMarketplaceUploadStatus = "ready" | "skipped" | "failed";

/**
 * POST /api/tr/owner/upload
 * multipart: file + boutiqueId + optional removeBackground ("true"|"false")
 * Returns original URL always; marketplaceUrl when Photoroom + normalize succeed.
 * Front/back product photos remove BG; extra gallery photos skip cutout.
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

  const removeBackgroundRaw = formData.get("removeBackground");
  const removeBackground =
    removeBackgroundRaw === null || removeBackgroundRaw === undefined
      ? true
      : String(removeBackgroundRaw).trim().toLowerCase() !== "false";

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const original = await uploadTrProductAsset({
      userId: authResult.auth.user.id,
      boutiqueId: boutique.id,
      bytes,
      contentType,
      kind: "original",
    });

    let marketplaceUrl: string | null = null;
    let marketplacePath: string | null = null;
    let marketplaceStatus: TrMarketplaceUploadStatus = "skipped";
    let marketplaceError: string | null = null;

    if (!removeBackground) {
      marketplaceStatus = "skipped";
    } else if (!isTrProductImageNormalizeEnabled()) {
      marketplaceStatus = "skipped";
    } else if (!isPhotoroomConfigured()) {
      marketplaceStatus = "failed";
      marketplaceError = "PHOTOROOM_API_KEY sunucuda tanımlı değil.";
      console.error("[tr/owner/upload]", marketplaceError);
    } else {
      try {
        const cutout = await removeGarmentBackground({
          bytes,
          filename: file.name || "product.jpg",
          mimeType: contentType,
        });
        const normalized = await normalizeProductCutoutToCanvas(cutout);
        const marketplace = await uploadTrProductAsset({
          userId: authResult.auth.user.id,
          boutiqueId: boutique.id,
          bytes: normalized,
          contentType: "image/png",
          kind: "marketplace",
        });
        marketplaceUrl = marketplace.url;
        marketplacePath = marketplace.path;
        marketplaceStatus = "ready";
      } catch (normalizeError) {
        marketplaceStatus = "failed";
        marketplaceError =
          normalizeError instanceof Error
            ? normalizeError.message
            : "Katalog kesiti oluşturulamadı.";
        console.error(
          "[tr/owner/upload] marketplace normalize failed (keeping original):",
          normalizeError,
        );
      }
    }

    return Response.json({
      url: original.url,
      path: original.path,
      marketplaceUrl,
      marketplacePath,
      marketplaceStatus,
      marketplaceError,
      removeBackground,
    });
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
