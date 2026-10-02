import { createAttribute, listAttributeEntries } from "@/lib/tr/catalog/productKinds";
import {
  badRequest,
  productKindErrorResponse,
  readJsonBody,
} from "@/lib/tr/catalog/productKindApi";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";
import { readAttributeBody } from "@/lib/tr/productKinds/rules";

export const runtime = "nodejs";

/** GET /api/tr/owner/attributes?boutiqueId= — the boutique's product fields (Özellikler). */
export async function GET(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const boutiqueId = new URL(request.url).searchParams.get("boutiqueId")?.trim() ?? "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });
  }
  try {
    return Response.json({ attributes: await listAttributeEntries(boutique.id) });
  } catch (error) {
    return productKindErrorResponse(error, "Özellikler yüklenemedi.");
  }
}

/** POST /api/tr/owner/attributes — create a field (its storage key comes from the label). */
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
    input = readAttributeBody(body);
  } catch (error) {
    return badRequest(error, "Özellik geçersiz.");
  }
  try {
    return Response.json(
      { attribute: await createAttribute(boutique.id, input) },
      { status: 201 },
    );
  } catch (error) {
    return productKindErrorResponse(error, "Özellik oluşturulamadı.");
  }
}
