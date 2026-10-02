import { normalizeCatalogProfile } from "@/lib/tr/catalogProfiles";
import { createKind, listKindEntries } from "@/lib/tr/catalog/productKinds";
import {
  badRequest,
  productKindErrorResponse,
  readJsonBody,
} from "@/lib/tr/catalog/productKindApi";
import { hasStarterKinds } from "@/lib/tr/catalog/starterDefinitions";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";
import { readKindBody } from "@/lib/tr/productKinds/rules";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/product-kinds?boutiqueId= — the boutique's kinds, each product's
 * kind, and whether the profile's starter kinds can be imported (none yet).
 */
export async function GET(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const boutiqueId = new URL(request.url).searchParams.get("boutiqueId")?.trim() ?? "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });
  }

  try {
    const { kinds, productKinds } = await listKindEntries(boutique.id);
    const importable =
      kinds.length === 0 && hasStarterKinds(normalizeCatalogProfile(boutique.catalogProfile));
    return Response.json({ kinds, productKinds, importable });
  } catch (error) {
    return productKindErrorResponse(error, "Ürün türleri yüklenemedi.");
  }
}

/** POST /api/tr/owner/product-kinds — create a kind. */
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

  let input;
  try {
    input = readKindBody(body);
  } catch (error) {
    return badRequest(error, "Ürün türü geçersiz.");
  }
  try {
    return Response.json({ kind: await createKind(boutique.id, input) }, { status: 201 });
  } catch (error) {
    return productKindErrorResponse(error, "Ürün türü oluşturulamadı.");
  }
}
