import { getPublicBoutiqueById } from "@/lib/tr/boutiques";
import { getPublicProductById } from "@/lib/tr/products";
import { isCustomArtCatalogProfile } from "@/lib/tr/catalogProfiles";
import { enforceCustomerReferenceUploadRateLimit } from "@/lib/tr/customArt/uploadRateLimit";
import {
  encodeOpaqueWebp,
  ORIGINAL_MAX_EDGE_PX,
} from "@/lib/tr/assets/encodeOpaqueImage";
import { uploadCustomerReferenceAsset } from "@/lib/tr/assets/trAssetStorage";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/**
 * POST /api/tr/customer/upload-reference
 * multipart: file, boutiqueId, productId
 */
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Geçersiz form verisi." }, { status: 400 });
  }

  const boutiqueIdRaw = formData.get("boutiqueId");
  const productIdRaw = formData.get("productId");
  const boutiqueId =
    typeof boutiqueIdRaw === "string" ? boutiqueIdRaw.trim() : "";
  const productId =
    typeof productIdRaw === "string" ? productIdRaw.trim() : "";

  if (!boutiqueId || !productId) {
    return Response.json(
      { error: "boutiqueId ve productId zorunlu." },
      { status: 400 },
    );
  }

  const rateLimited = await enforceCustomerReferenceUploadRateLimit(
    request,
    boutiqueId,
  );
  if (rateLimited) return rateLimited;

  const boutique = await getPublicBoutiqueById(boutiqueId);
  if (!boutique || !isCustomArtCatalogProfile(boutique)) {
    return Response.json({ error: "Mağaza bulunamadı." }, { status: 404 });
  }

  const product = await getPublicProductById(productId);
  if (!product || product.boutiqueId !== boutique.id) {
    return Response.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Fotoğraf seçin." }, { status: 400 });
  }

  const contentType = file.type.trim().toLowerCase();
  if (!ALLOWED_TYPES.has(contentType)) {
    return Response.json(
      { error: "Yalnızca JPG, PNG veya WebP yükleyebilirsiniz." },
      { status: 400 },
    );
  }

  try {
    const inputBytes = Buffer.from(await file.arrayBuffer());
    const encoded = await encodeOpaqueWebp(inputBytes, ORIGINAL_MAX_EDGE_PX);

    const uploaded = await uploadCustomerReferenceAsset({
      boutiqueId: boutique.id,
      bytes: encoded.bytes,
      contentType: encoded.contentType,
    });

    return Response.json({
      url: uploaded.url,
      referenceId: uploaded.referenceId,
    });
  } catch (error) {
    console.error("[tr/customer/upload-reference]", error);
    const message =
      error instanceof Error ? error.message : "Yükleme başarısız.";
    return Response.json({ error: message }, { status: 500 });
  }
}
