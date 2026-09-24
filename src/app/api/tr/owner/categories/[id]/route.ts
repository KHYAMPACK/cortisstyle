import {
  deleteCategory,
  getCategory,
  updateCategory,
} from "@/lib/tr/catalog/categories";
import {
  categoryErrorResponse,
  readCategoryBody,
} from "@/lib/tr/catalog/categoryApi";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Load the category and check the signed-in owner owns its boutique. */
async function loadOwned(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return { response: authResult.response } as const;

  const { id } = await context.params;
  const category = await getCategory(id);
  if (!category || !requireOwnedBoutique(authResult.auth, category.boutiqueId)) {
    return {
      response: Response.json({ error: "Kategori bulunamadı." }, { status: 404 }),
    } as const;
  }
  return { category } as const;
}

/** GET /api/tr/owner/categories/[id] */
export async function GET(request: Request, context: RouteContext) {
  const loaded = await loadOwned(request, context);
  if ("response" in loaded) return loaded.response;
  return Response.json({ category: loaded.category });
}

/** PATCH /api/tr/owner/categories/[id] — partial update. */
export async function PATCH(request: Request, context: RouteContext) {
  const loaded = await loadOwned(request, context);
  if ("response" in loaded) return loaded.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  try {
    const category = await updateCategory(loaded.category.id, readCategoryBody(body));
    return Response.json({ category });
  } catch (error) {
    return categoryErrorResponse(error, "Kategori güncellenemedi.");
  }
}

/** DELETE /api/tr/owner/categories/[id] — subcategories move up, products lose it. */
export async function DELETE(request: Request, context: RouteContext) {
  const loaded = await loadOwned(request, context);
  if ("response" in loaded) return loaded.response;

  try {
    await deleteCategory(loaded.category.id);
    return Response.json({ ok: true });
  } catch (error) {
    return categoryErrorResponse(error, "Kategori silinemedi.");
  }
}
