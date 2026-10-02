import { deleteKind, getKind, updateKind } from "@/lib/tr/catalog/productKinds";
import {
  badRequest,
  productKindErrorResponse,
  readJsonBody,
} from "@/lib/tr/catalog/productKindApi";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";
import { readKindBody } from "@/lib/tr/productKinds/rules";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Load the kind and check the signed-in owner owns its boutique. */
async function loadOwned(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return { response: authResult.response } as const;

  const { id } = await context.params;
  const kind = await getKind(id);
  if (!kind || !requireOwnedBoutique(authResult.auth, kind.boutiqueId)) {
    return {
      response: Response.json({ error: "Ürün türü bulunamadı." }, { status: 404 }),
    } as const;
  }
  return { kind } as const;
}

/** GET /api/tr/owner/product-kinds/[id] */
export async function GET(request: Request, context: RouteContext) {
  const loaded = await loadOwned(request, context);
  if ("response" in loaded) return loaded.response;
  return Response.json({ kind: loaded.kind });
}

/** PATCH /api/tr/owner/product-kinds/[id] — replaces the name, starting types, category and fields. */
export async function PATCH(request: Request, context: RouteContext) {
  const loaded = await loadOwned(request, context);
  if ("response" in loaded) return loaded.response;

  const body = await readJsonBody(request);
  if (body instanceof Response) return body;
  let input;
  try {
    input = readKindBody(body);
  } catch (error) {
    return badRequest(error, "Ürün türü geçersiz.");
  }
  try {
    return Response.json({ kind: await updateKind(loaded.kind.id, input) });
  } catch (error) {
    return productKindErrorResponse(error, "Ürün türü güncellenemedi.");
  }
}

/** DELETE /api/tr/owner/product-kinds/[id] — its products keep their data, without a kind. */
export async function DELETE(request: Request, context: RouteContext) {
  const loaded = await loadOwned(request, context);
  if ("response" in loaded) return loaded.response;
  try {
    await deleteKind(loaded.kind.id);
    return Response.json({ ok: true });
  } catch (error) {
    return productKindErrorResponse(error, "Ürün türü silinemedi.");
  }
}
