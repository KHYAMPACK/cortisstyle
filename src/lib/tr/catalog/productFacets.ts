import { getServiceSupabase } from "@/lib/supabaseAdmin";

/**
 * Values a boutique already uses in its products, offered as suggestions in the
 * creatable fields (Marka, Etiket, Tedarikçi). There are no Markalar / Etiketler pages
 * yet, so the products themselves are the list.
 */
export interface TrProductFacets {
  brands: string[];
  tags: string[];
  suppliers: string[];
}

export const EMPTY_PRODUCT_FACETS: TrProductFacets = {
  brands: [],
  tags: [],
  suppliers: [],
};

const FACET_LIMIT = 500;

function sortedDistinct(values: Iterable<string>): string[] {
  const byKey = new Map<string, string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase("tr");
    if (!byKey.has(key)) byKey.set(key, trimmed);
  }
  return [...byKey.values()]
    .sort((a, b) => a.localeCompare(b, "tr"))
    .slice(0, FACET_LIMIT);
}

/** A missing column / table (the patches not applied yet) just means "no suggestions". */
function isMissingSchema(error: { code?: string; message?: string }): boolean {
  if (["42703", "42P01", "PGRST204", "PGRST205"].includes(error.code ?? "")) {
    return true;
  }
  return /does not exist|schema cache/i.test(error.message ?? "");
}

export async function getProductFacetsAdmin(
  boutiqueId: string,
): Promise<TrProductFacets> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const [products, privateRows] = await Promise.all([
    supabase.from("tr_products").select("brand, tags").eq("boutique_id", boutiqueId),
    supabase.from("tr_product_private").select("supplier").eq("boutique_id", boutiqueId),
  ]);

  if (products.error && !isMissingSchema(products.error)) throw products.error;
  if (privateRows.error && !isMissingSchema(privateRows.error)) {
    throw privateRows.error;
  }

  const brands: string[] = [];
  const tags: string[] = [];
  for (const row of products.data ?? []) {
    if (typeof row.brand === "string") brands.push(row.brand);
    if (Array.isArray(row.tags)) {
      for (const tag of row.tags) if (typeof tag === "string") tags.push(tag);
    }
  }
  const suppliers = (privateRows.data ?? []).flatMap((row) =>
    typeof row.supplier === "string" ? [row.supplier] : [],
  );

  return {
    brands: sortedDistinct(brands),
    tags: sortedDistinct(tags),
    suppliers: sortedDistinct(suppliers),
  };
}
