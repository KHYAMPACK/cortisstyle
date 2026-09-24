import { requireTrOwner } from "@/lib/tr/ownerAuth";
import { boutiqueOffersIyzicoCheckout } from "@/lib/tr/payments/registry";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/boutiques
 * Returns boutiques owned by the authenticated user.
 */
export async function GET(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const boutiques = await Promise.all(
    authResult.auth.boutiques.map(async (boutique) => ({
      id: boutique.id,
      slug: boutique.slug,
      name: boutique.name,
      logoUrl: boutique.logoUrl,
      themeAccent: boutique.themeAccent,
      status: boutique.status,
      catalogProfile: boutique.catalogProfile,
      physicalAddress: boutique.physicalAddress,
      shippingAddress: boutique.shippingAddress,
      offersIyzicoCheckout: await boutiqueOffersIyzicoCheckout(boutique.slug),
    })),
  );

  return Response.json({
    isStaff: authResult.auth.isStaff,
    boutiques,
  });
}
