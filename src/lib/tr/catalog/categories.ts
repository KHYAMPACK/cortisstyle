import { getServiceSupabase } from "@/lib/supabaseAdmin";
import {
  categoryAndDescendantIds,
  wouldCreateCycle,
} from "@/lib/tr/categories/tree";
import {
  mapCategoryRow,
  readCategoryMode,
  type TrCategory,
  type TrCategoryListEntry,
  type TrCategoryMode,
  type TrProductCategories,
} from "@/lib/tr/categories/types";
import type { TrCategorySortCriterion } from "@/lib/tr/categories/sortCriteria";
import { sanitizeSeo, type TrSeo } from "@/lib/tr/seo/seoFields";
import { generateUniqueSlug, isValidSlug, slugify } from "@/lib/tr/seo/slug";

/**
 * A boutique's own categories (`category_mode = 'custom'`): reading, writing, and
 * assigning them to products. Server only, through the service role.
 *
 * Reads are tolerant — before `patch_categories.sql` is applied they behave as
 * "legacy boutique, no categories" so the storefront never breaks. Writes report a
 * missing schema instead of failing silently.
 */

type DbError = { code?: string; message?: string };

function isSchemaMissing(error: DbError): boolean {
  if (["42703", "42P01", "PGRST204", "PGRST205"].includes(error.code ?? "")) {
    return true;
  }
  return /does not exist|schema cache|could not find/i.test(error.message ?? "");
}

function isUniqueViolation(error: DbError): boolean {
  return error.code === "23505";
}

const SCHEMA_HINT =
  "Kategoriler kullanılamıyor: veritabanı güncellemesi (patch_categories.sql) henüz uygulanmamış.";

export class CategoryError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 = 400,
  ) {
    super(message);
    this.name = "CategoryError";
  }
}

function client() {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

// ---------------------------------------------------------------- reads

export async function getBoutiqueCategoryMode(
  boutiqueId: string,
): Promise<TrCategoryMode> {
  const supabase = getServiceSupabase();
  if (!supabase) return "legacy";
  const { data, error } = await supabase
    .from("tr_boutiques")
    .select("category_mode")
    .eq("id", boutiqueId)
    .maybeSingle();
  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/categories] mode lookup failed:", error.message);
    }
    return "legacy";
  }
  return readCategoryMode(data?.category_mode);
}

/** Every category of a boutique, unordered. */
export async function listCategories(boutiqueId: string): Promise<TrCategory[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tr_categories")
    .select("*")
    .eq("boutique_id", boutiqueId);
  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/categories] list failed:", error.message);
    }
    return [];
  }
  return (data ?? []).map((row) => mapCategoryRow(row as Record<string, unknown>));
}

/** The panel's list: each category with how many products sit directly in it. */
export async function listCategoryEntries(
  boutiqueId: string,
): Promise<TrCategoryListEntry[]> {
  const categories = await listCategories(boutiqueId);
  if (categories.length === 0) return [];

  const counts = new Map<string, number>();
  const supabase = client();
  const { data, error } = await supabase
    .from("tr_product_categories")
    .select("category_id")
    .in(
      "category_id",
      categories.map((category) => category.id),
    );
  if (!error) {
    for (const row of data ?? []) {
      const id = String(row.category_id);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return categories.map((category) => ({
    ...category,
    productCount: counts.get(category.id) ?? 0,
  }));
}

export async function getCategory(id: string): Promise<TrCategory | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("tr_categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/categories] lookup failed:", error.message);
    }
    return null;
  }
  return data ? mapCategoryRow(data as Record<string, unknown>) : null;
}

export async function findCategoryBySlug(
  boutiqueId: string,
  slug: string,
): Promise<TrCategory | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("tr_categories")
    .select("*")
    .eq("boutique_id", boutiqueId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/categories] slug lookup failed:", error.message);
    }
    return null;
  }
  return data ? mapCategoryRow(data as Record<string, unknown>) : null;
}

/** The category that used to have `oldSlug`, if it was renamed. */
export async function findRedirectedCategoryId(
  boutiqueId: string,
  oldSlug: string,
): Promise<string | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("tr_slug_redirects")
    .select("entity_id")
    .eq("boutique_id", boutiqueId)
    .eq("entity_type", "category")
    .eq("old_slug", oldSlug)
    .maybeSingle();
  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/categories] redirect lookup failed:", error.message);
    }
    return null;
  }
  return typeof data?.entity_id === "string" ? data.entity_id : null;
}

export async function getProductCategories(
  productId: string,
): Promise<TrProductCategories> {
  const supabase = getServiceSupabase();
  if (!supabase) return { ids: [], primaryId: null };
  const { data, error } = await supabase
    .from("tr_product_categories")
    .select("category_id, is_primary")
    .eq("product_id", productId);
  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/categories] product lookup failed:", error.message);
    }
    return { ids: [], primaryId: null };
  }
  const rows = data ?? [];
  return {
    ids: rows.map((row) => String(row.category_id)),
    primaryId:
      rows.find((row) => row.is_primary === true)?.category_id?.toString() ?? null,
  };
}

/** Ids of the products assigned to any of these categories. */
export async function listProductIdsInCategories(
  categoryIds: readonly string[],
): Promise<Set<string>> {
  const result = new Set<string>();
  if (categoryIds.length === 0) return result;
  const supabase = getServiceSupabase();
  if (!supabase) return result;
  const { data, error } = await supabase
    .from("tr_product_categories")
    .select("product_id")
    .in("category_id", [...categoryIds]);
  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/categories] membership lookup failed:", error.message);
    }
    return result;
  }
  for (const row of data ?? []) result.add(String(row.product_id));
  return result;
}

/**
 * Units sold per product of a boutique, for the "En Çok Satanlar" ordering. Cancelled,
 * failed and refunded orders don't count.
 */
export async function getSalesByProduct(
  boutiqueId: string,
): Promise<Map<string, number>> {
  const sales = new Map<string, number>();
  const supabase = getServiceSupabase();
  if (!supabase) return sales;
  const { data, error } = await supabase
    .from("tr_order_items")
    .select("product_id, quantity, tr_orders!inner(payment_status, fulfillment_status)")
    .eq("boutique_id", boutiqueId)
    .limit(5000);
  if (error) {
    console.error("[tr/categories] sales lookup failed:", error.message);
    return sales;
  }
  for (const row of data ?? []) {
    const order = (Array.isArray(row.tr_orders) ? row.tr_orders[0] : row.tr_orders) as
      | { payment_status?: string; fulfillment_status?: string }
      | null;
    if (!order || order.fulfillment_status === "cancelled") continue;
    if (order.payment_status === "failed" || order.payment_status === "refunded") continue;
    const productId = typeof row.product_id === "string" ? row.product_id : null;
    if (!productId) continue;
    sales.set(productId, (sales.get(productId) ?? 0) + (Number(row.quantity) || 0));
  }
  return sales;
}

// ---------------------------------------------------------------- category writes

export interface CategoryWriteInput {
  name?: string;
  parentId?: string | null;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  sortCriterion?: TrCategorySortCriterion | null;
  seo?: TrSeo;
}

async function isCategorySlugTaken(
  boutiqueId: string,
  slug: string,
  exceptId?: string,
): Promise<boolean> {
  let query = client()
    .from("tr_categories")
    .select("id")
    .eq("boutique_id", boutiqueId)
    .eq("slug", slug)
    .limit(1);
  if (exceptId) query = query.neq("id", exceptId);
  const { data, error } = await query;
  if (error) {
    if (isSchemaMissing(error)) return false;
    throw error;
  }
  return (data?.length ?? 0) > 0;
}

function cleanName(value: string | undefined): string {
  return (value ?? "").trim().slice(0, 80);
}

function nullIfBlank(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function assertCustomMode(boutiqueId: string): Promise<void> {
  if ((await getBoutiqueCategoryMode(boutiqueId)) !== "custom") {
    throw new CategoryError(
      "Bu butik hazır kategori ağacını kullanıyor; özel kategoriler etkin değil.",
    );
  }
}

export async function createCategory(
  boutiqueId: string,
  input: CategoryWriteInput,
): Promise<TrCategory> {
  await assertCustomMode(boutiqueId);
  const name = cleanName(input.name);
  if (!name) throw new CategoryError("Kategori adı zorunlu.");

  const all = await listCategories(boutiqueId);
  if (input.parentId && !all.some((entry) => entry.id === input.parentId)) {
    throw new CategoryError("Ebeveyn kategori bulunamadı.", 404);
  }

  const requested = input.slug?.trim() || null;
  if (requested) {
    if (!isValidSlug(requested)) {
      throw new CategoryError("Slug yalnızca küçük harf, rakam ve tek tire içermeli.");
    }
    if (await isCategorySlugTaken(boutiqueId, requested)) {
      throw new CategoryError(`"${requested}" slug'ı başka bir kategoride kullanılıyor.`, 409);
    }
  }

  const supabase = client();
  const taken = new Set<string>();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug =
      requested ??
      (await generateUniqueSlug(
        slugify(name),
        async (candidate) =>
          taken.has(candidate) || (await isCategorySlugTaken(boutiqueId, candidate)),
      ));
    const { data, error } = await supabase
      .from("tr_categories")
      .insert({
        boutique_id: boutiqueId,
        parent_id: input.parentId ?? null,
        name,
        slug,
        description: nullIfBlank(input.description),
        image_url: nullIfBlank(input.imageUrl),
        sort_criterion: input.sortCriterion ?? null,
        seo: input.seo ? sanitizeSeo(input.seo) : {},
      })
      .select("*")
      .single();
    if (!error) return mapCategoryRow(data as Record<string, unknown>);
    if (isSchemaMissing(error)) throw new CategoryError(SCHEMA_HINT);
    if (isUniqueViolation(error)) {
      if (requested) {
        throw new CategoryError(`"${requested}" slug'ı başka bir kategoride kullanılıyor.`, 409);
      }
      taken.add(slug); // lost a race for this slug: take the next free one
      continue;
    }
    throw error;
  }
  throw new CategoryError("Uygun bir slug bulunamadı.", 409);
}

/** Keep `tr_products.category` equal to the primary category's slug. */
async function syncProductCategoryColumn(
  productId: string,
  slug: string | null,
): Promise<void> {
  const { error } = await client()
    .from("tr_products")
    .update({ category: slug })
    .eq("id", productId);
  if (error) {
    console.error("[tr/categories] could not sync the product's category:", error.message);
  }
}

/** After a category's slug changed, refresh the copy on every product whose primary it is. */
async function syncPrimarySlugForCategory(category: TrCategory): Promise<void> {
  const { data, error } = await client()
    .from("tr_product_categories")
    .select("product_id")
    .eq("category_id", category.id)
    .eq("is_primary", true);
  if (error) return;
  for (const row of data ?? []) {
    await syncProductCategoryColumn(String(row.product_id), category.slug);
  }
}

export async function updateCategory(
  id: string,
  input: CategoryWriteInput,
): Promise<TrCategory> {
  const current = await getCategory(id);
  if (!current) throw new CategoryError("Kategori bulunamadı.", 404);
  const all = await listCategories(current.boutiqueId);

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.name !== undefined) {
    const name = cleanName(input.name);
    if (!name) throw new CategoryError("Kategori adı zorunlu.");
    row.name = name;
  }
  if (input.parentId !== undefined) {
    if (input.parentId && !all.some((entry) => entry.id === input.parentId)) {
      throw new CategoryError("Ebeveyn kategori bulunamadı.", 404);
    }
    if (wouldCreateCycle(all, id, input.parentId)) {
      throw new CategoryError("Bir kategori kendi alt kategorisinin altına taşınamaz.");
    }
    row.parent_id = input.parentId;
  }
  if (input.description !== undefined) row.description = nullIfBlank(input.description);
  if (input.imageUrl !== undefined) row.image_url = nullIfBlank(input.imageUrl);
  if (input.sortCriterion !== undefined) row.sort_criterion = input.sortCriterion;
  if (input.seo !== undefined) row.seo = sanitizeSeo(input.seo);

  let newSlug: string | undefined;
  if (input.slug !== undefined) {
    const slug = input.slug?.trim() ?? "";
    if (!slug) throw new CategoryError("Slug boş olamaz.");
    if (!isValidSlug(slug)) {
      throw new CategoryError("Slug yalnızca küçük harf, rakam ve tek tire içermeli.");
    }
    if (slug !== current.slug) {
      if (await isCategorySlugTaken(current.boutiqueId, slug, id)) {
        throw new CategoryError(`"${slug}" slug'ı başka bir kategoride kullanılıyor.`, 409);
      }
      row.slug = slug;
      newSlug = slug;
    }
  }

  const supabase = client();
  const { data, error } = await supabase
    .from("tr_categories")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (isSchemaMissing(error)) throw new CategoryError(SCHEMA_HINT);
    if (isUniqueViolation(error)) {
      throw new CategoryError("Bu slug başka bir kategoride kullanılıyor.", 409);
    }
    throw error;
  }
  const updated = mapCategoryRow(data as Record<string, unknown>);

  if (newSlug) {
    // Keep the old address working, release the new one from the redirect table,
    // and refresh the slug copied onto products.
    await supabase.from("tr_slug_redirects").upsert(
      {
        boutique_id: current.boutiqueId,
        entity_type: "category",
        old_slug: current.slug,
        entity_id: id,
      },
      { onConflict: "boutique_id,entity_type,old_slug" },
    );
    await supabase
      .from("tr_slug_redirects")
      .delete()
      .eq("boutique_id", current.boutiqueId)
      .eq("entity_type", "category")
      .eq("old_slug", newSlug);
    await syncPrimarySlugForCategory(updated);
  }
  return updated;
}

/**
 * Delete a category. Its subcategories move up one level; products that had it as
 * primary get another of their categories as primary (or none).
 */
export async function deleteCategory(id: string): Promise<void> {
  const current = await getCategory(id);
  if (!current) throw new CategoryError("Kategori bulunamadı.", 404);
  const supabase = client();

  const { data: primaries } = await supabase
    .from("tr_product_categories")
    .select("product_id")
    .eq("category_id", id)
    .eq("is_primary", true);
  const affectedProducts = (primaries ?? []).map((row) => String(row.product_id));

  const { error: moveError } = await supabase
    .from("tr_categories")
    .update({ parent_id: current.parentId })
    .eq("parent_id", id);
  if (moveError) throw moveError;

  const { error } = await supabase.from("tr_categories").delete().eq("id", id);
  if (error) throw error;

  await supabase
    .from("tr_slug_redirects")
    .delete()
    .eq("entity_type", "category")
    .eq("entity_id", id);

  for (const productId of affectedProducts) {
    const remaining = await getProductCategories(productId);
    const next = remaining.ids[0] ?? null;
    if (next) {
      await supabase
        .from("tr_product_categories")
        .update({ is_primary: true })
        .eq("product_id", productId)
        .eq("category_id", next);
      const category = await getCategory(next);
      await syncProductCategoryColumn(productId, category?.slug ?? null);
    } else {
      await syncProductCategoryColumn(productId, null);
    }
  }
}

// ---------------------------------------------------------------- product assignment

/**
 * Replace a product's categories. `primaryId` must be one of them (the first is used
 * when it isn't); no categories means no primary. Keeps `tr_products.category` in sync.
 */
export async function setProductCategories(input: {
  productId: string;
  boutiqueId: string;
  categoryIds: readonly string[];
  primaryId?: string | null;
}): Promise<TrProductCategories> {
  await assertCustomMode(input.boutiqueId);
  const wanted = [...new Set(input.categoryIds)];
  const all = await listCategories(input.boutiqueId);
  const byId = new Map(all.map((category) => [category.id, category]));
  for (const id of wanted) {
    if (!byId.has(id)) throw new CategoryError("Kategori bulunamadı.", 404);
  }
  const primaryId =
    wanted.length === 0
      ? null
      : input.primaryId && wanted.includes(input.primaryId)
        ? input.primaryId
        : wanted[0]!;

  const supabase = client();
  const existing = await getProductCategories(input.productId);
  const toRemove = existing.ids.filter((id) => !wanted.includes(id));
  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("tr_product_categories")
      .delete()
      .eq("product_id", input.productId)
      .in("category_id", toRemove);
    if (error) {
      if (isSchemaMissing(error)) throw new CategoryError(SCHEMA_HINT);
      throw error;
    }
  }
  // Clear the old primary first: only one row per product may be primary.
  if (existing.primaryId && existing.primaryId !== primaryId) {
    await supabase
      .from("tr_product_categories")
      .update({ is_primary: false })
      .eq("product_id", input.productId);
  }
  if (wanted.length > 0) {
    const { error } = await supabase.from("tr_product_categories").upsert(
      wanted.map((categoryId) => ({
        product_id: input.productId,
        category_id: categoryId,
        is_primary: categoryId === primaryId,
      })),
      { onConflict: "product_id,category_id" },
    );
    if (error) {
      if (isSchemaMissing(error)) throw new CategoryError(SCHEMA_HINT);
      throw error;
    }
  }

  await syncProductCategoryColumn(
    input.productId,
    primaryId ? (byId.get(primaryId)?.slug ?? null) : null,
  );
  return { ids: wanted, primaryId };
}

/** Bulk "add these products to a category". Products with no primary yet get it as primary. */
export async function addProductsToCategory(input: {
  boutiqueId: string;
  categoryId: string;
  productIds: readonly string[];
}): Promise<void> {
  for (const productId of new Set(input.productIds)) {
    const current = await getProductCategories(productId);
    if (current.ids.includes(input.categoryId)) continue;
    await setProductCategories({
      productId,
      boutiqueId: input.boutiqueId,
      categoryIds: [...current.ids, input.categoryId],
      primaryId: current.primaryId ?? input.categoryId,
    });
  }
}

/** Category plus everything below it, as ids — what "products in this category" means. */
export async function categoryScopeIds(
  boutiqueId: string,
  categoryId: string,
): Promise<string[]> {
  return categoryAndDescendantIds(await listCategories(boutiqueId), categoryId);
}

