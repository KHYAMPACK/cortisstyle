import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { sanitizeSeo, type TrSeo } from "@/lib/tr/seo/seoFields";
import {
  generateUniqueSlug,
  isValidSlug,
  slugify,
} from "@/lib/tr/seo/slug";

/**
 * Product slugs, their SEO overrides and the old-slug redirects.
 *
 * Reads used by the storefront are tolerant: when `patch_product_seo.sql` has not
 * been applied (the columns or the table are missing) they behave as "no slug, no
 * overrides" instead of failing, so shipping the app first is safe. Writes are not
 * silent: a missing column is an error the owner can see.
 */

type DbError = { code?: string; message?: string };

/** Postgres / PostgREST "column or table does not exist". */
function isSchemaMissing(error: DbError): boolean {
  if (["42703", "42P01", "PGRST204", "PGRST205"].includes(error.code ?? "")) {
    return true;
  }
  return /does not exist|schema cache|could not find/i.test(error.message ?? "");
}

function isUniqueViolation(error: DbError): boolean {
  return error.code === "23505";
}

export class ProductSlugTakenError extends Error {
  constructor(slug: string) {
    super(`"${slug}" slug'ı bu butikte başka bir üründe kullanılıyor.`);
    this.name = "ProductSlugTakenError";
  }
}

const SCHEMA_HINT =
  "Slug kaydedilemedi: veritabanı güncellemesi (patch_product_seo.sql) henüz uygulanmamış.";

// ---------------------------------------------------------------- storefront reads

/** Id of this store's public product that currently has `slug`, or null. */
export async function findPublicProductIdBySlug(
  boutiqueId: string,
  slug: string,
): Promise<string | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tr_products")
    .select("id")
    .eq("boutique_id", boutiqueId)
    .eq("slug", slug)
    .in("status", ["available", "sold"])
    .maybeSingle();

  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/productSlug] slug lookup failed:", error.message);
    }
    return null;
  }
  return typeof data?.id === "string" ? data.id : null;
}

/** The product that used to have `oldSlug`, if it was renamed. */
export async function findRedirectedProductId(
  boutiqueId: string,
  oldSlug: string,
): Promise<string | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tr_slug_redirects")
    .select("entity_id")
    .eq("boutique_id", boutiqueId)
    .eq("entity_type", "product")
    .eq("old_slug", oldSlug)
    .maybeSingle();

  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/productSlug] redirect lookup failed:", error.message);
    }
    return null;
  }
  return typeof data?.entity_id === "string" ? data.entity_id : null;
}

export interface ProductSlugSeo {
  slug: string | null;
  seo: TrSeo;
}

const NO_SLUG_SEO: ProductSlugSeo = { slug: null, seo: {} };

/** A product's slug and SEO overrides (the storefront's column lists don't carry them). */
export async function getProductSlugSeo(productId: string): Promise<ProductSlugSeo> {
  const supabase = getServiceSupabase();
  if (!supabase) return NO_SLUG_SEO;

  const { data, error } = await supabase
    .from("tr_products")
    .select("slug, seo")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/productSlug] slug/seo lookup failed:", error.message);
    }
    return NO_SLUG_SEO;
  }
  return {
    slug: typeof data?.slug === "string" ? data.slug : null,
    seo: sanitizeSeo(data?.seo),
  };
}

export interface ProductSlugInfo {
  slug: string | null;
  noindex: boolean;
}

/**
 * Slug and noindex flag of every product of a store that has either — for the
 * sitemap and the Google feed. Products without both are simply absent.
 */
export async function listProductSlugInfo(
  boutiqueId: string,
): Promise<Map<string, ProductSlugInfo>> {
  const result = new Map<string, ProductSlugInfo>();
  const supabase = getServiceSupabase();
  if (!supabase) return result;

  const { data, error } = await supabase
    .from("tr_products")
    .select("id, slug, seo")
    .eq("boutique_id", boutiqueId);

  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/productSlug] slug list failed:", error.message);
    }
    return result;
  }

  for (const row of data ?? []) {
    const slug = typeof row.slug === "string" ? row.slug : null;
    const noindex = sanitizeSeo(row.seo).noindex === true;
    if (slug || noindex) result.set(String(row.id), { slug, noindex });
  }
  return result;
}

// ---------------------------------------------------------------- owner writes

async function isSlugTaken(
  boutiqueId: string,
  slug: string,
  exceptProductId?: string,
): Promise<boolean> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  let query = supabase
    .from("tr_products")
    .select("id")
    .eq("boutique_id", boutiqueId)
    .eq("slug", slug)
    .limit(1);
  if (exceptProductId) query = query.neq("id", exceptProductId);

  const { data, error } = await query;
  if (error) {
    if (isSchemaMissing(error)) return false;
    throw error;
  }
  return (data?.length ?? 0) > 0;
}

/**
 * A free slug for a new product, from its title (`deri-cuzdan`, `deri-cuzdan-2`…).
 * `skip` lists slugs to treat as taken, for retrying after an insert lost a race.
 */
export async function generateUniqueProductSlug(
  boutiqueId: string,
  title: string,
  skip = new Set<string>(),
): Promise<string> {
  return generateUniqueSlug(
    slugify(title),
    async (candidate) =>
      skip.has(candidate) || (await isSlugTaken(boutiqueId, candidate)),
  );
}

/** Throws `ProductSlugTakenError` when another product of the store has `slug`. */
export async function assertProductSlugFree(
  boutiqueId: string,
  slug: string,
  exceptProductId?: string,
): Promise<void> {
  if (await isSlugTaken(boutiqueId, slug, exceptProductId)) {
    throw new ProductSlugTakenError(slug);
  }
}

export function isProductSlugConflict(error: unknown): boolean {
  return (
    error instanceof ProductSlugTakenError ||
    (typeof error === "object" &&
      error !== null &&
      isUniqueViolation(error as DbError) &&
      /slug/i.test((error as DbError).message ?? ""))
  );
}

/**
 * Change (or clear) a product's slug and keep the old address working: the old slug
 * is recorded in `tr_slug_redirects`, and the new one is released from the redirect
 * table in case it was once somebody's old slug.
 */
export async function setProductSlugAdmin(input: {
  productId: string;
  boutiqueId: string;
  slug: string | null;
}): Promise<void> {
  const { productId, boutiqueId, slug } = input;
  if (slug !== null && !isValidSlug(slug)) {
    throw new Error("Geçersiz slug: küçük harf, rakam ve tek tire kullanın.");
  }

  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const { data: current, error: readError } = await supabase
    .from("tr_products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  if (readError) {
    if (isSchemaMissing(readError)) throw new Error(SCHEMA_HINT);
    throw readError;
  }

  const oldSlug = typeof current?.slug === "string" ? current.slug : null;
  if (oldSlug === slug) return;

  if (slug !== null) await assertProductSlugFree(boutiqueId, slug, productId);

  const { error: updateError } = await supabase
    .from("tr_products")
    .update({ slug })
    .eq("id", productId);
  if (updateError) {
    if (isSchemaMissing(updateError)) throw new Error(SCHEMA_HINT);
    if (isUniqueViolation(updateError) && slug) {
      throw new ProductSlugTakenError(slug);
    }
    throw updateError;
  }

  // The product is saved; the bookkeeping below must not fail the request.
  if (oldSlug) {
    const { error } = await supabase.from("tr_slug_redirects").upsert(
      {
        boutique_id: boutiqueId,
        entity_type: "product",
        old_slug: oldSlug,
        entity_id: productId,
      },
      { onConflict: "boutique_id,entity_type,old_slug" },
    );
    if (error) {
      console.error("[tr/productSlug] could not record the old slug:", error.message);
    }
  }
  if (slug) {
    const { error } = await supabase
      .from("tr_slug_redirects")
      .delete()
      .eq("boutique_id", boutiqueId)
      .eq("entity_type", "product")
      .eq("old_slug", slug);
    if (error) {
      console.error("[tr/productSlug] could not release the new slug:", error.message);
    }
  }
}
