import { ensureTrCustomerProfile } from "@/lib/tr/customerProfiles";
import { getPublicBoutiqueBySlug } from "@/lib/tr/boutiques";
import { createClient } from "@supabase/supabase-js";

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
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return Response.json({ error: "Supabase not configured." }, { status: 500 });
  }

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
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
    userId: user.id,
    boutiqueId,
    boutiqueSlug: slug,
    host: body.host?.trim().toLowerCase() || null,
  });

  return Response.json({ ok: true });
}
