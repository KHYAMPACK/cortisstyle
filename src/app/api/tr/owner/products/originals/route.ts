import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { listOwnerProductOriginalsAdmin } from "@/lib/tr/products";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/products/originals?boutiqueId=
 * Staff-only: full original upload galleries (not packshot cutouts).
 */
export async function GET(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  if (!authResult.auth.isStaff) {
    return new Response(null, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const boutiqueId = searchParams.get("boutiqueId")?.trim() ?? "";
  if (!boutiqueId) {
    return Response.json({ error: "boutiqueId zorunlu." }, { status: 400 });
  }

  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return new Response(null, { status: 404 });
  }

  const products = await listOwnerProductOriginalsAdmin(boutique.id);
  return Response.json({ products });
}
