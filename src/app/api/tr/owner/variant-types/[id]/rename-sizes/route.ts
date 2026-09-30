import { getVariantType, renameSizesOnProducts } from "@/lib/tr/catalog/variantTypes";
import { variantTypeErrorResponse } from "@/lib/tr/catalog/variantTypeApi";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";
import { readSizeRenamesBody } from "@/lib/tr/variants/sizeRenames";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/tr/owner/variant-types/[id]/rename-sizes — after renaming sizes in a Beden
 * type, rename them on the boutique's products too. Body: `{ renames: [{ from, to }] }`.
 */
export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const type = await getVariantType(id);
  if (!type || !requireOwnedBoutique(authResult.auth, type.boutiqueId)) {
    return Response.json({ error: "Varyant türü bulunamadı." }, { status: 404 });
  }

  let renames;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    renames = readSizeRenamesBody(body.renames);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Geçersiz istek." },
      { status: 400 },
    );
  }

  try {
    const updated = await renameSizesOnProducts(type.id, renames);
    return Response.json({ updated });
  } catch (error) {
    return variantTypeErrorResponse(error, "Ürünlerdeki bedenler güncellenemedi.");
  }
}
