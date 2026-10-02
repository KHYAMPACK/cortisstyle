import { getServerServiceSupabase } from "@/lib/supabase/supabaseServer";
import {
  buildProductRedirectMap,
  productRedirectKey,
  type ProductRedirect,
} from "@/lib/tr/catalog/productRedirectRules";

/**
 * The moved product addresses (`productRedirectRules.ts`) for `proxy`, read with the
 * service role and kept per warm instance for a minute, like the boutique domain map.
 * Only a cold instance waits for the read; a failed read keeps the last good map.
 */

const TTL_MS = 60_000;
let cached = new Map<string, ProductRedirect>();
let cachedAt = 0;
let inFlight: Promise<void> | null = null;

async function load(): Promise<Map<string, ProductRedirect> | null> {
  const supabase = getServerServiceSupabase();
  if (!supabase) return null;
  const [boutiques, merged, slugRedirects] = await Promise.all([
    supabase.from("tr_boutiques").select("id, slug"),
    supabase
      .from("tr_products")
      .select("id, boutique_id, slug, merged_into, features")
      .not("merged_into", "is", null),
    supabase
      .from("tr_slug_redirects")
      .select("boutique_id, old_slug, entity_id")
      .eq("entity_type", "product"),
  ]);
  if (boutiques.error) return null;
  // Before their patches these are missing: nothing has moved that way yet.
  const mergedRows = merged.error ? [] : (merged.data ?? []);
  const slugRows = slugRedirects.error ? [] : (slugRedirects.data ?? []);

  const targetIds = [
    ...new Set([
      ...mergedRows.map((row) => String(row.merged_into)),
      ...slugRows.map((row) => String(row.entity_id)),
    ]),
  ];
  const currentSlugs = new Map<string, string | null>();
  if (targetIds.length > 0) {
    const targets = await supabase.from("tr_products").select("id, slug").in("id", targetIds);
    if (targets.error) return null;
    for (const row of targets.data ?? []) {
      currentSlugs.set(String(row.id), typeof row.slug === "string" && row.slug ? row.slug : null);
    }
  }

  return buildProductRedirectMap({
    boutiques: (boutiques.data ?? []).map((row) => ({ id: String(row.id), slug: String(row.slug) })),
    merged: mergedRows.map((row) => {
      const color = (row.features as Record<string, unknown> | null)?.color;
      return {
        id: String(row.id),
        boutiqueId: String(row.boutique_id),
        slug: typeof row.slug === "string" && row.slug ? row.slug : null,
        mergedInto: String(row.merged_into),
        color: typeof color === "string" && color.trim() ? color.trim() : null,
      };
    }),
    slugRedirects: slugRows.map((row) => ({
      boutiqueId: String(row.boutique_id),
      oldSlug: String(row.old_slug),
      productId: String(row.entity_id),
    })),
    currentSlugs,
  });
}

async function refresh(): Promise<void> {
  try {
    const next = await load();
    if (next) cached = next;
  } catch (error) {
    console.error("[proxy] product redirects:", error);
  }
  cachedAt = Date.now();
}

/** Where a moved product address now lives, or `null`. */
export async function lookupProductRedirectAtEdge(
  boutiqueSlug: string,
  param: string,
): Promise<ProductRedirect | null> {
  if (Date.now() - cachedAt > TTL_MS && !inFlight) {
    inFlight = refresh().finally(() => {
      inFlight = null;
    });
  }
  if (cachedAt === 0 && inFlight) await inFlight;
  return cached.get(productRedirectKey(boutiqueSlug, param)) ?? null;
}
