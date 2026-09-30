import {
  createCategory,
  getBoutiqueCategoryMode,
  listCategoryEntries,
} from "@/lib/tr/catalog/categories";
import {
  categoryErrorResponse,
  readCategoryBody,
} from "@/lib/tr/catalog/categoryApi";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/categories?boutiqueId= — the boutique's categories, its category mode,
 * and whether the built-in tree can be imported.
 */
export async function GET(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const boutiqueId =
    new URL(request.url).searchParams.get("boutiqueId")?.trim() ?? "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });
  }

  try {
    const [mode, categories] = await Promise.all([
      getBoutiqueCategoryMode(boutique.id),
      listCategoryEntries(boutique.id),
    ]);
    // A fashion boutique still on the built-in tree can import it as its own categories.
    const importable =
      mode === "legacy" && categories.length === 0 && boutique.catalogProfile === "fashion";
    return Response.json({ mode, categories, importable });
  } catch (error) {
    return categoryErrorResponse(error, "Kategoriler yüklenemedi.");
  }
}

/** POST /api/tr/owner/categories — create a category. */
export async function POST(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const boutiqueId =
    typeof body.boutiqueId === "string" ? body.boutiqueId.trim() : "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });
  }

  try {
    const category = await createCategory(boutique.id, readCategoryBody(body));
    return Response.json({ category }, { status: 201 });
  } catch (error) {
    return categoryErrorResponse(error, "Kategori oluşturulamadı.");
  }
}
