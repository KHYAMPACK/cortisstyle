import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import {
  getBoutiqueByIdAdmin,
  updateBoutiqueBrandAdmin,
  type UpdateTrBoutiqueBrandInput,
} from "@/lib/tr/boutiques";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tr/owner/boutiques/[id]
 * PATCH /api/tr/owner/boutiques/[id] — brand/contact fields only
 */
export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const owned = requireOwnedBoutique(authResult.auth, id);
  if (!owned) {
    return Response.json({ error: "Butik bulunamadı." }, { status: 404 });
  }

  const boutique = await getBoutiqueByIdAdmin(id);
  if (!boutique) {
    return Response.json({ error: "Butik bulunamadı." }, { status: 404 });
  }

  return Response.json({
    boutique: {
      id: boutique.id,
      slug: boutique.slug,
      name: boutique.name,
      description: boutique.description,
      logoUrl: boutique.logoUrl,
      whatsappPhone: boutique.whatsappPhone,
      instagramHandle: boutique.instagramHandle,
      shippingNote: boutique.shippingNote,
      exchangePolicy: boutique.exchangePolicy,
      physicalAddress: boutique.physicalAddress,
      themeAccent: boutique.themeAccent,
      status: boutique.status,
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const owned = requireOwnedBoutique(authResult.auth, id);
  if (!owned) {
    return Response.json({ error: "Butik bulunamadı." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const patch: UpdateTrBoutiqueBrandInput = {};
  const stringOrNull = (value: unknown): string | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === "string") return value;
    return undefined;
  };

  const description = stringOrNull(body.description);
  if (description !== undefined) patch.description = description;
  const logoUrl = stringOrNull(body.logoUrl);
  if (logoUrl !== undefined) patch.logoUrl = logoUrl;
  const whatsappPhone = stringOrNull(body.whatsappPhone);
  if (whatsappPhone !== undefined) patch.whatsappPhone = whatsappPhone;
  const instagramHandle = stringOrNull(body.instagramHandle);
  if (instagramHandle !== undefined) patch.instagramHandle = instagramHandle;
  const shippingNote = stringOrNull(body.shippingNote);
  if (shippingNote !== undefined) patch.shippingNote = shippingNote;
  const exchangePolicy = stringOrNull(body.exchangePolicy);
  if (exchangePolicy !== undefined) patch.exchangePolicy = exchangePolicy;
  const physicalAddress = stringOrNull(body.physicalAddress);
  if (physicalAddress !== undefined) patch.physicalAddress = physicalAddress;
  const themeAccent = stringOrNull(body.themeAccent);
  if (themeAccent !== undefined) patch.themeAccent = themeAccent;

  try {
    const boutique = await updateBoutiqueBrandAdmin(id, patch);
    return Response.json({
      boutique: {
        id: boutique.id,
        slug: boutique.slug,
        name: boutique.name,
        description: boutique.description,
        logoUrl: boutique.logoUrl,
        whatsappPhone: boutique.whatsappPhone,
        instagramHandle: boutique.instagramHandle,
        shippingNote: boutique.shippingNote,
        exchangePolicy: boutique.exchangePolicy,
        physicalAddress: boutique.physicalAddress,
        themeAccent: boutique.themeAccent,
        status: boutique.status,
      },
    });
  } catch (error) {
    console.error("[tr/owner/boutiques/[id]] patch failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Butik güncellenemedi.",
      },
      { status: 500 },
    );
  }
}
