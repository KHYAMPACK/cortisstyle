import { isTrAdminAuthorized } from "@/lib/tr/adminAuth";
import {
  getServerAnonSupabase,
  getServerServiceSupabase,
  getSupabaseHostLabel,
} from "@/lib/supabase/supabaseServer";
import { PUBLIC_BOUTIQUE_VIEW } from "@/lib/tr/catalog/boutiques";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnose why storefronts 404 without exposing secrets.
 * GET /api/tr/admin/boutique-health
 * Authorization: Bearer {TR_ADMIN_SECRET}
 */
export async function GET(request: Request) {
  if (!isTrAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const host = getSupabaseHostLabel();
  const hasAnon = Boolean(getServerAnonSupabase());
  const hasService = Boolean(getServerServiceSupabase());

  const anon = getServerAnonSupabase();
  const service = getServerServiceSupabase();

  async function probe(
    label: string,
    client: ReturnType<typeof getServerAnonSupabase>,
  ) {
    if (!client) {
      return { label, ok: false, error: "client_unavailable", slugs: [] as string[] };
    }
    const { data, error } = await client
      .from(PUBLIC_BOUTIQUE_VIEW)
      .select("slug,status")
      .order("slug");
    if (error) {
      return {
        label,
        ok: false,
        error: error.message || error.code || "query_failed",
        slugs: [] as string[],
      };
    }
    return {
      label,
      ok: true,
      error: null as string | null,
      slugs: (data ?? []).map((row) => String((row as { slug: string }).slug)),
    };
  }

  const anonProbe = await probe("anon_public_view", anon);
  const serviceProbe = await probe("service_public_view", service);

  async function probeProducts(slug: string) {
    const client = anon ?? service;
    if (!client) {
      return { slug, ok: false, error: "client_unavailable", count: 0 };
    }
    const { data: boutiques, error: boutiqueError } = await client
      .from(PUBLIC_BOUTIQUE_VIEW)
      .select("id,slug")
      .eq("slug", slug)
      .maybeSingle();
    if (boutiqueError) {
      return {
        slug,
        ok: false,
        error: boutiqueError.message || "boutique_query_failed",
        count: 0,
      };
    }
    if (!boutiques) {
      return { slug, ok: false, error: "boutique_not_in_public_view", count: 0 };
    }
    const boutiqueId = String((boutiques as { id: string }).id);
    const { data, error } = await client
      .from("tr_products")
      .select("id")
      .eq("boutique_id", boutiqueId)
      .in("status", ["available", "sold"])
      .limit(5);
    if (error) {
      return {
        slug,
        ok: false,
        error: error.message || error.code || "products_query_failed",
        count: 0,
      };
    }
    return { slug, ok: true, error: null as string | null, count: (data ?? []).length };
  }

  const productProbes = {
    lilabutik: await probeProducts("lilabutik"),
    pervinsoysalbutik: await probeProducts("pervinsoysalbutik"),
  };

  let tableStatuses: Array<{ slug: string; status: string }> = [];
  let tableError: string | null = null;
  if (service) {
    const { data, error } = await service
      .from("tr_boutiques")
      .select("slug,status")
      .order("slug");
    if (error) {
      tableError = error.message || error.code || "query_failed";
    } else {
      tableStatuses = (data ?? []).map((row) => ({
        slug: String((row as { slug: string }).slug),
        status: String((row as { status: string }).status),
      }));
    }
  }

  return Response.json({
    ok: anonProbe.ok || serviceProbe.ok,
    supabaseHost: host,
    hasAnonKey: hasAnon,
    hasServiceRoleKey: hasService,
    publicView: {
      anon: anonProbe,
      service: serviceProbe,
    },
    products: productProbes,
    table: {
      error: tableError,
      boutiques: tableStatuses,
    },
    hints: [
      "tr_boutiques_public only returns status=verified",
      "Storefront soft-404 with Lila chrome = boutique OK but products query failed (see products.*)",
      "If products probe fails with column/schema errors, apply product patches or rely on resilient column fallbacks",
      "If service probe fails with JWT errors, rotate SUPABASE_SERVICE_ROLE_KEY in Vercel to match the project",
    ],
  });
}
