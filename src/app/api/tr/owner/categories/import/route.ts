import { planCategoryImport } from "@/lib/tr/categories/importPlan";
import {
  getBoutiqueCategoryMode,
  importCategoryPlan,
  listProductCategoryColumns,
} from "@/lib/tr/catalog/categories";
import { categoryErrorResponse } from "@/lib/tr/catalog/categoryApi";
import {
  fashionCategoryAliases,
  fashionCategoryTemplate,
} from "@/lib/tr/fashion/categoryTemplate";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

/**
 * POST /api/tr/owner/categories/import — "Hazır kategorileri içe aktar": copy the
 * built-in garment tree into the boutique's own categories (same slugs, system keys set)
 * and file every product under its current category. Fashion boutiques on the built-in
 * tree only. The boutique stays in `legacy` mode; switching it is a separate step.
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
    if ((await getBoutiqueCategoryMode(boutique.id)) !== "legacy") {
      return Response.json(
        { error: "Bu butik zaten kendi kategorilerini kullanıyor." },
        { status: 409 },
      );
    }
    const plan = planCategoryImport({
      template: fashionCategoryTemplate(),
      aliases: fashionCategoryAliases(),
      products: await listProductCategoryColumns(boutique.id),
    });
    const created = await importCategoryPlan(boutique.id, plan);
    return Response.json(
      { created, assigned: plan.assignments.length },
      { status: 201 },
    );
  } catch (error) {
    return categoryErrorResponse(error, "Hazır kategoriler aktarılamadı.");
  }
}
