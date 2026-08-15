import { ensureTrCustomerProfile } from "@/lib/tr/customerProfiles";
import { getPublicBoutiqueBySlug } from "@/lib/tr/boutiques";
import { getCustomerUserFromRequest } from "@/lib/tr/customerAuth";

export const runtime = "nodejs";

type Body = {
  boutiqueSlug?: string;
  host?: string;
};

/**
 * Records registration_source for the authenticated user (once).
 * POST /api/tr/customer/registration-source
 * Authorization: Bearer <supabase access token>
 */
export async function POST(request: Request) {
  const auth = await getCustomerUserFromRequest(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const slug = body.boutiqueSlug?.trim().toLowerCase() || null;
  let boutiqueId: string | null = null;
  if (slug) {
    const boutique = await getPublicBoutiqueBySlug(slug);
    boutiqueId = boutique?.id ?? null;
  }

  await ensureTrCustomerProfile({
    userId: auth.user.id,
    boutiqueId,
    boutiqueSlug: slug,
    host: body.host?.trim().toLowerCase() || null,
  });

  return Response.json({ ok: true });
}
