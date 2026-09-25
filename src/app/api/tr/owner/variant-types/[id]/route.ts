import {
  deleteVariantType,
  getVariantType,
  updateVariantType,
} from "@/lib/tr/catalog/variantTypes";
import { variantTypeErrorResponse } from "@/lib/tr/catalog/variantTypeApi";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";
import { readVariantTypeBody } from "@/lib/tr/variants/typeRules";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Load the type and check the signed-in owner owns its boutique. */
async function loadOwned(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return { response: authResult.response } as const;

  const { id } = await context.params;
  const type = await getVariantType(id);
  if (!type || !requireOwnedBoutique(authResult.auth, type.boutiqueId)) {
    return {
      response: Response.json({ error: "Varyant türü bulunamadı." }, { status: 404 }),
    } as const;
  }
  return { type } as const;
}

/** GET /api/tr/owner/variant-types/[id] */
export async function GET(request: Request, context: RouteContext) {
  const loaded = await loadOwned(request, context);
  if ("response" in loaded) return loaded.response;
  return Response.json({ type: loaded.type });
}

/** PATCH /api/tr/owner/variant-types/[id] — replaces the name, style and value list. */
export async function PATCH(request: Request, context: RouteContext) {
  const loaded = await loadOwned(request, context);
  if ("response" in loaded) return loaded.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  let input;
  try {
    input = readVariantTypeBody(body);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Varyant türü geçersiz." },
      { status: 400 },
    );
  }

  try {
    const type = await updateVariantType(loaded.type.id, input);
    return Response.json({ type });
  } catch (error) {
    return variantTypeErrorResponse(error, "Varyant türü güncellenemedi.");
  }
}

/** DELETE /api/tr/owner/variant-types/[id] — the type and its values. */
export async function DELETE(request: Request, context: RouteContext) {
  const loaded = await loadOwned(request, context);
  if ("response" in loaded) return loaded.response;

  try {
    await deleteVariantType(loaded.type.id);
    return Response.json({ ok: true });
  } catch (error) {
    return variantTypeErrorResponse(error, "Varyant türü silinemedi.");
  }
}
