import { getProductFacetsAdmin } from "@/lib/tr/catalog/productFacets";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

/** GET /api/tr/owner/products/facets?boutiqueId= — brands, tags and suppliers already in use. */
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
    return Response.json(await getProductFacetsAdmin(boutique.id));
  } catch (error) {
    console.error("[tr/owner/products/facets] failed:", error);
    return Response.json({ error: "Öneriler yüklenemedi." }, { status: 500 });
  }
}
