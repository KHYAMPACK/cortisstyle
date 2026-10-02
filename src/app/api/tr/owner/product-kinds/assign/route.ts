import { setProductsKind } from "@/lib/tr/catalog/productKinds";
import { productKindErrorResponse, readJsonBody } from "@/lib/tr/catalog/productKindApi";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

const MAX_PRODUCTS = 500;

/**
 * POST /api/tr/owner/product-kinds/assign — { boutiqueId, kindId | null, productIds }:
 * the Ürünler list's "Tür ata" bulk action. Only the kind changes; product data stays.
 */
export async function POST(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const body = await readJsonBody(request);
  if (body instanceof Response) return body;
  const boutiqueId = typeof body.boutiqueId === "string" ? body.boutiqueId.trim() : "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });
  }
  const kindId = typeof body.kindId === "string" && body.kindId ? body.kindId : null;
  const productIds = Array.isArray(body.productIds)
    ? body.productIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  if (productIds.length === 0 || productIds.length > MAX_PRODUCTS) {
    return Response.json({ error: "Ürün seçin." }, { status: 400 });
  }

  try {
    await setProductsKind(boutique.id, kindId, productIds);
    return Response.json({ ok: true });
  } catch (error) {
    return productKindErrorResponse(error, "Ürün türü atanamadı.");
  }
}
