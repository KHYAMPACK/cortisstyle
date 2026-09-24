import { addProductsToCategory, getCategory } from "@/lib/tr/catalog/categories";
import { categoryErrorResponse } from "@/lib/tr/catalog/categoryApi";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/tr/owner/categories/[id]/products  { productIds: string[] }
 * Adds products to the category (bulk "Kategori ekle"). A product with no primary
 * category gets this one as primary; existing categories are kept.
 */
export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const category = await getCategory(id);
  if (!category || !requireOwnedBoutique(authResult.auth, category.boutiqueId)) {
    return Response.json({ error: "Kategori bulunamadı." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const productIds = Array.isArray(body.productIds)
    ? body.productIds.filter((value): value is string => typeof value === "string")
    : [];
  if (productIds.length === 0 || productIds.length > 500) {
    return Response.json({ error: "1–500 ürün seçin." }, { status: 400 });
  }

  try {
    await addProductsToCategory({
      boutiqueId: category.boutiqueId,
      categoryId: category.id,
      productIds,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return categoryErrorResponse(error, "Ürünler kategoriye eklenemedi.");
  }
}
