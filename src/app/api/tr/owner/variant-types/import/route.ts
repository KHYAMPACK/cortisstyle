import { importPresetTypes } from "@/lib/tr/catalog/variantTypes";
import { variantTypeErrorResponse } from "@/lib/tr/catalog/variantTypeApi";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

/**
 * POST /api/tr/owner/variant-types/import — turn the boutique's saved sizes and colours
 * (the chips of the product editor) into a Beden and a Renk type. Only what is not
 * already a type of that name is created.
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

  const boutiqueId =
    typeof body.boutiqueId === "string" ? body.boutiqueId.trim() : "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });
  }

  try {
    const types = await importPresetTypes(boutique.id);
    return Response.json({ types }, { status: 201 });
  } catch (error) {
    return variantTypeErrorResponse(error, "İçe aktarılamadı.");
  }
}
