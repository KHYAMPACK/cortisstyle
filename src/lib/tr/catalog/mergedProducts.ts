import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { looksLikeUuid } from "@/lib/tr/seo/slug";

/**
 * Products merged into another as one of its colours (F6). They are hidden, not
 * deleted, and point at the product that took them in (`tr_products.merged_into`), so
 * their old addresses can send shoppers there. Server only.
 */

/** Where a merged product now lives, with the colour it became; `null` = not merged. */
export async function findMergedProductTarget(
  boutiqueId: string,
  param: string,
): Promise<{ productId: string; color: string | null } | null> {
  const id = param.trim();
  if (!looksLikeUuid(id)) return null;
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("tr_products")
    .select("merged_into, features")
    .eq("id", id)
    .eq("boutique_id", boutiqueId)
    .not("merged_into", "is", null)
    .maybeSingle();
  // Before `patch_product_merged_into.sql` the column doesn't exist: nothing is merged.
  if (error || !data) return null;
  const row = data as { merged_into: string | null; features: Record<string, unknown> | null };
  if (!row.merged_into) return null;
  const color = row.features?.color;
  return {
    productId: row.merged_into,
    color: typeof color === "string" && color.trim() ? color.trim() : null,
  };
}
