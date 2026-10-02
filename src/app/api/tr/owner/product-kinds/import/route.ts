import { normalizeCatalogProfile } from "@/lib/tr/catalogProfiles";
import { productKindErrorResponse, readJsonBody } from "@/lib/tr/catalog/productKindApi";
import { hasStarterKinds, seedStarterKinds } from "@/lib/tr/catalog/starterDefinitions";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

/**
 * POST /api/tr/owner/product-kinds/import — "Hazır türleri içe aktar": create the
 * profile's starter kinds and fields the boutique doesn't have yet, and give every
 * product without a kind the one its category maps to.
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
  const profile = normalizeCatalogProfile(boutique.catalogProfile);
  if (!hasStarterKinds(profile)) {
    return Response.json(
      { error: "Bu butik türü için hazır ürün türü yok." },
      { status: 400 },
    );
  }

  try {
    return Response.json(await seedStarterKinds(boutique.id, profile), { status: 201 });
  } catch (error) {
    return productKindErrorResponse(error, "Hazır türler aktarılamadı.");
  }
}
