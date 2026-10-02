import { categoryErrorResponse } from "@/lib/tr/catalog/categoryApi";
import { seedFashionCategories } from "@/lib/tr/fashion/seedCategories";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

/**
 * POST /api/tr/owner/categories/import — "Hazır kategorileri içe aktar": give a fashion
 * boutique with no categories yet the starter tree, and file every product under its
 * current category (`seedFashionCategories`).
 */
export async function POST(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const boutiqueId = typeof body.boutiqueId === "string" ? body.boutiqueId.trim() : "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });
  }
  if (boutique.catalogProfile !== "fashion") {
    return Response.json(
      { error: "Hazır kategori ağacı yalnızca moda butikleri için var." },
      { status: 400 },
    );
  }

  try {
    return Response.json(await seedFashionCategories(boutique.id), { status: 201 });
  } catch (error) {
    return categoryErrorResponse(error, "Hazır kategoriler aktarılamadı.");
  }
}
