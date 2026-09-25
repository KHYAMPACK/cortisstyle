import {
  createVariantType,
  getPresetImportInfo,
  listVariantTypeEntries,
} from "@/lib/tr/catalog/variantTypes";
import { variantTypeErrorResponse } from "@/lib/tr/catalog/variantTypeApi";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";
import { readVariantTypeBody } from "@/lib/tr/variants/typeRules";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/variant-types?boutiqueId= — the boutique's variant types, and how
 * many saved sizes / colours could still be imported as Beden / Renk.
 */
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
    const [types, importable] = await Promise.all([
      listVariantTypeEntries(boutique.id),
      getPresetImportInfo(boutique.id),
    ]);
    return Response.json({ types, importable });
  } catch (error) {
    return variantTypeErrorResponse(error, "Varyant türleri yüklenemedi.");
  }
}

/** POST /api/tr/owner/variant-types — create a type with its values. */
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
    const type = await createVariantType(boutique.id, input);
    return Response.json({ type }, { status: 201 });
  } catch (error) {
    return variantTypeErrorResponse(error, "Varyant türü oluşturulamadı.");
  }
}
