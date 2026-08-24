import { requireTrOwner } from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/boutiques
 * Returns boutiques owned by the authenticated user.
 */
export async function GET(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  return Response.json({
    isStaff: authResult.auth.isStaff,
    boutiques: authResult.auth.boutiques.map((boutique) => ({
      id: boutique.id,
      slug: boutique.slug,
      name: boutique.name,
      logoUrl: boutique.logoUrl,
      themeAccent: boutique.themeAccent,
      status: boutique.status,
    })),
  });
}
