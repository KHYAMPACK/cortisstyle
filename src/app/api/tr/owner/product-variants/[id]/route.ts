import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";
import {
  productVariantsErrorResponse,
  setVariantStock,
} from "@/lib/tr/catalog/productVariants";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/tr/owner/product-variants/:id  { boutiqueId, stock }
 * One variant's stock, from the Stok page. The product's stock follows (the sum of its
 * active variants).
 */
export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    boutiqueId?: unknown;
    stock?: unknown;
  } | null;
  const boutique = requireOwnedBoutique(
    authResult.auth,
    typeof body?.boutiqueId === "string" ? body.boutiqueId.trim() : "",
  );
  if (!boutique) {
    return Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });
  }
  const stock = body?.stock;
  if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0 || stock > 1_000_000) {
    return Response.json({ error: "Geçerli bir stok sayısı girin." }, { status: 400 });
  }

  try {
    const result = await setVariantStock({ boutiqueId: boutique.id, variantId: id, stock });
    if (!result) return Response.json({ error: "Varyant bulunamadı." }, { status: 404 });
    return Response.json(result);
  } catch (error) {
    const known = productVariantsErrorResponse(error);
    if (known) return known;
    console.error("[tr/owner/product-variants/[id]]", error);
    return Response.json({ error: "Stok güncellenemedi." }, { status: 500 });
  }
}
