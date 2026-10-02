import { deleteAttribute, getAttribute, updateAttribute } from "@/lib/tr/catalog/productKinds";
import {
  badRequest,
  productKindErrorResponse,
  readJsonBody,
} from "@/lib/tr/catalog/productKindApi";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";
import { readAttributeBody } from "@/lib/tr/productKinds/rules";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function loadOwned(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return { response: authResult.response } as const;

  const { id } = await context.params;
  const attribute = await getAttribute(id);
  if (!attribute || !requireOwnedBoutique(authResult.auth, attribute.boutiqueId)) {
    return {
      response: Response.json({ error: "Özellik bulunamadı." }, { status: 404 }),
    } as const;
  }
  return { attribute } as const;
}

/** PATCH /api/tr/owner/attributes/[id] — label, input and options (the key never changes). */
export async function PATCH(request: Request, context: RouteContext) {
  const loaded = await loadOwned(request, context);
  if ("response" in loaded) return loaded.response;

  const body = await readJsonBody(request);
  if (body instanceof Response) return body;
  let input;
  try {
    input = readAttributeBody(body);
  } catch (error) {
    return badRequest(error, "Özellik geçersiz.");
  }
  try {
    return Response.json({ attribute: await updateAttribute(loaded.attribute.id, input) });
  } catch (error) {
    return productKindErrorResponse(error, "Özellik güncellenemedi.");
  }
}

/** DELETE /api/tr/owner/attributes/[id] — removed from every kind; product values stay. */
export async function DELETE(request: Request, context: RouteContext) {
  const loaded = await loadOwned(request, context);
  if ("response" in loaded) return loaded.response;
  try {
    await deleteAttribute(loaded.attribute.id);
    return Response.json({ ok: true });
  } catch (error) {
    return productKindErrorResponse(error, "Özellik silinemedi.");
  }
}
