import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicBoutiqueById, getPublicBoutiqueBySlug } from "@/lib/tr/boutiques";
import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { getPublicCatalogSupabase } from "@/lib/supabase/supabaseServer";
import { mapProductRow } from "@/lib/tr/mappers";
import type {
  CreateTrProductInput,
  TrProduct,
  TrProductStatus,
  TrProductWithBoutique,
  UpdateTrProductInput,
} from "@/types/tr-marketplace";

const PRODUCT_COLUMNS_CORE =
  "id, boutique_id, title, description, price_kurus, compare_at_price_kurus, size, sizes, colors, condition_label, category, images, marketplace_images, lifestyle_images, catalog_background_id, status, stock, sort_order, created_at, updated_at";

/** Includes size_stocks when the migration has been applied. */
const PUBLIC_PRODUCT_COLUMNS = `${PRODUCT_COLUMNS_CORE}, size_stocks`;

function isMissingColumnError(
  error: {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  },
  column?: string,
): boolean {
  const blob = [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const looksMissing =
    blob.includes("does not exist") ||
    blob.includes("schema cache") ||
    blob.includes("could not find") ||
    blob.includes("pgrst204");
  if (!looksMissing) return false;
  if (!column) return true;
  return blob.includes(column.toLowerCase());
}

function isMissingSizeStocksColumn(error: {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}): boolean {
  return isMissingColumnError(error, "size_stocks");
}

/** PostgREST: "Could not find the 'col' column of 'tr_products' in the schema cache" */
function missingColumnFromError(error: {
  message?: string;
}): string | null {
  const match = error.message?.match(
    /could not find the '([^']+)' column/i,
  );
  return match?.[1] ?? null;
}

function productInsertRow(
  input: CreateTrProductInput,
  omitColumns: ReadonlySet<string> = new Set(),
) {
  const row: Record<string, unknown> = {
    boutique_id: input.boutiqueId,
    title: input.title.trim(),
    description: input.description?.trim() ?? null,
    price_kurus: input.priceKurus,
    compare_at_price_kurus: input.compareAtPriceKurus ?? null,
    size: input.size?.trim() ?? null,
    sizes: input.sizes ?? [],
    colors: input.colors ?? [],
    condition_label: input.conditionLabel?.trim() ?? null,
    category: input.category?.trim() ?? null,
    images: input.images ?? [],
    marketplace_images: input.marketplaceImages ?? [],
    lifestyle_images: input.lifestyleImages ?? [],
    catalog_background_id: input.catalogBackgroundId?.trim() || null,
    status: input.status ?? "available",
    stock: input.stock ?? 1,
    size_stocks: input.sizeStocks ?? {},
    sort_order: input.sortOrder ?? 0,
  };
  for (const column of omitColumns) {
    delete row[column];
  }
  return row;
}

export async function listPublicProductsByBoutiqueSlug(
  boutiqueSlug: string,
  client?: SupabaseClient,
): Promise<TrProductWithBoutique[]> {
  const boutique = await getPublicBoutiqueBySlug(boutiqueSlug, client);
  if (!boutique) return [];

  return listPublicProductsByBoutiqueId(boutique.id, boutique, client);
}

const PRODUCT_SELECT_CANDIDATES = [
  PUBLIC_PRODUCT_COLUMNS,
  PRODUCT_COLUMNS_CORE,
  // Minimal set if older prod DBs lack marketplace/lifestyle/catalog columns.
  "id, boutique_id, title, description, price_kurus, size, category, images, status, sort_order, created_at, updated_at",
] as const;

export async function listPublicProductsByBoutiqueId(
  boutiqueId: string,
  boutique: TrProductWithBoutique["boutique"],
  client?: SupabaseClient,
): Promise<TrProductWithBoutique[]> {
  const supabase = getPublicCatalogSupabase(client);

  let lastError: { message?: string; code?: string } | null = null;

  for (const columns of PRODUCT_SELECT_CANDIDATES) {
    const { data, error } = await supabase
      .from("tr_products")
      .select(columns)
      .eq("boutique_id", boutiqueId)
      .in("status", ["available", "sold"])
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!error) {
      return (data ?? []).map((row) => ({
        ...mapProductRow(row as Record<string, unknown>),
        boutique,
      }));
    }

    lastError = error;
    const missing = missingColumnFromError(error);
    if (missing || isMissingColumnError(error)) {
      continue;
    }
    throw error;
  }

  if (lastError) throw lastError;
  return [];
}

export async function getPublicProductById(
  productId: string,
  client?: SupabaseClient,
): Promise<TrProductWithBoutique | null> {
  const supabase = getPublicCatalogSupabase(client);

  const primary = await supabase
    .from("tr_products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("id", productId)
    .in("status", ["available", "sold"])
    .maybeSingle();

  const result =
    primary.error && isMissingSizeStocksColumn(primary.error)
      ? await supabase
          .from("tr_products")
          .select(PRODUCT_COLUMNS_CORE)
          .eq("id", productId)
          .in("status", ["available", "sold"])
          .maybeSingle()
      : primary;

  if (result.error) throw result.error;
  if (!result.data) return null;

  const product = mapProductRow(result.data as Record<string, unknown>);
  const boutique = await getPublicBoutiqueById(product.boutiqueId);
  if (!boutique) return null;

  return { ...product, boutique };
}

/** All available items from verified boutiques — for marketplace browse / outfit builder. */
export async function listPublicAvailableProducts(
  client?: SupabaseClient,
): Promise<TrProductWithBoutique[]> {
  const supabase = getPublicCatalogSupabase(client);

  const primary = await supabase
    .from("tr_products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("status", "available")
    .order("created_at", { ascending: false });

  const result =
    primary.error && isMissingSizeStocksColumn(primary.error)
      ? await supabase
          .from("tr_products")
          .select(PRODUCT_COLUMNS_CORE)
          .eq("status", "available")
          .order("created_at", { ascending: false })
      : primary;

  if (result.error) throw result.error;

  const products: TrProductWithBoutique[] = [];
  for (const row of result.data ?? []) {
    const product = mapProductRow(row as Record<string, unknown>);
    const boutique = await getPublicBoutiqueById(product.boutiqueId);
    if (boutique) {
      products.push({ ...product, boutique });
    }
  }

  return products;
}

export async function listProductsByBoutiqueIdAdmin(
  boutiqueId: string,
): Promise<TrProduct[]> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_products")
    .select("*")
    .eq("boutique_id", boutiqueId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => mapProductRow(row as Record<string, unknown>));
}

export async function createProductAdmin(
  input: CreateTrProductInput,
): Promise<TrProduct> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const omitColumns = new Set<string>();
  // Optional columns that older DBs may not have yet.
  const optionalRetryBudget = 6;

  for (let attempt = 0; attempt < optionalRetryBudget; attempt += 1) {
    const { data, error } = await supabase
      .from("tr_products")
      .insert(productInsertRow(input, omitColumns))
      .select("*")
      .single();

    if (!error) {
      return mapProductRow(data as Record<string, unknown>);
    }

    const missing = missingColumnFromError(error);
    if (missing && isMissingColumnError(error, missing)) {
      console.warn(
        `[tr/products] column '${missing}' missing — saving without it. Apply matching supabase/patch_*.sql when ready.`,
      );
      omitColumns.add(missing);
      continue;
    }

    throw error;
  }

  throw new Error("Ürün oluşturulamadı (şema uyumsuzluğu).");
}

export async function getProductByIdAdmin(
  productId: string,
): Promise<TrProduct | null> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapProductRow(data as Record<string, unknown>);
}

export async function listProductsByIdsAdmin(
  productIds: string[],
): Promise<TrProduct[]> {
  const unique = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_products")
    .select("*")
    .in("id", unique);

  if (error) throw error;
  return (data ?? []).map((row) => mapProductRow(row as Record<string, unknown>));
}

function productUpdateRow(input: UpdateTrProductInput): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  if (input.title !== undefined) row.title = input.title.trim();
  if (input.description !== undefined) {
    row.description = input.description?.trim() ?? null;
  }
  if (input.priceKurus !== undefined) row.price_kurus = input.priceKurus;
  if (input.compareAtPriceKurus !== undefined) {
    row.compare_at_price_kurus = input.compareAtPriceKurus;
  }
  if (input.size !== undefined) row.size = input.size?.trim() ?? null;
  if (input.sizes !== undefined) row.sizes = input.sizes;
  if (input.colors !== undefined) row.colors = input.colors;
  if (input.conditionLabel !== undefined) {
    row.condition_label = input.conditionLabel?.trim() ?? null;
  }
  if (input.category !== undefined) {
    row.category = input.category?.trim() ?? null;
  }
  if (input.images !== undefined) row.images = input.images;
  if (input.marketplaceImages !== undefined) {
    row.marketplace_images = input.marketplaceImages;
  }
  if (input.lifestyleImages !== undefined) {
    row.lifestyle_images = input.lifestyleImages;
  }
  if (input.catalogBackgroundId !== undefined) {
    row.catalog_background_id = input.catalogBackgroundId?.trim() || null;
  }
  if (input.status !== undefined) row.status = input.status;
  if (input.stock !== undefined) row.stock = input.stock;
  if (input.sizeStocks !== undefined) row.size_stocks = input.sizeStocks;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;

  return row;
}

export async function updateProductAdmin(
  productId: string,
  input: UpdateTrProductInput,
): Promise<TrProduct> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const row = productUpdateRow(input);

  // Restocking a sold-out product should make it buyable again.
  if (
    input.status === undefined &&
    (input.stock !== undefined || input.sizeStocks !== undefined)
  ) {
    const existing = await getProductByIdAdmin(productId);
    if (!existing) throw new Error("Product not found.");
    const nextStock =
      input.stock !== undefined
        ? input.stock
        : input.sizeStocks !== undefined
          ? Object.values(input.sizeStocks).reduce((sum, n) => sum + n, 0)
          : existing.stock;
    if (nextStock > 0 && existing.status === "sold") {
      row.status = "available";
    }
    if (nextStock <= 0 && existing.status === "available") {
      row.status = "sold";
    }
  }

  if (Object.keys(row).length === 0) {
    const existing = await getProductByIdAdmin(productId);
    if (!existing) throw new Error("Product not found.");
    return existing;
  }

  const { data, error } = await supabase
    .from("tr_products")
    .update(row)
    .eq("id", productId)
    .select("*")
    .single();

  if (error) {
    const missing = missingColumnFromError(error);
    if (missing && missing in row && isMissingColumnError(error, missing)) {
      console.warn(
        `[tr/products] column '${missing}' missing on update — applying without it.`,
      );
      const { [missing]: _omit, ...rest } = row;
      const retry = await supabase
        .from("tr_products")
        .update(rest)
        .eq("id", productId)
        .select("*")
        .single();
      if (retry.error) throw retry.error;
      return mapProductRow(retry.data as Record<string, unknown>);
    }
    throw error;
  }

  return mapProductRow(data as Record<string, unknown>);
}

function isForeignKeyViolation(error: {
  code?: string;
  message?: string;
  details?: string;
}): boolean {
  if (error.code === "23503") return true;
  const blob = [error.message, error.details].filter(Boolean).join(" ").toLowerCase();
  return (
    blob.includes("foreign key") ||
    blob.includes("violates foreign key") ||
    blob.includes("tr_order_items")
  );
}

export type DeleteProductResult = {
  /** Hard-removed from DB. */
  mode: "deleted" | "hidden";
};

/**
 * Remove a product from the catalog.
 * - Prefer hard delete (order lines detach when SQL patch is applied).
 * - If past orders still block the FK, hide the product so the storefront is clear.
 */
export async function deleteProductAdmin(
  productId: string,
): Promise<DeleteProductResult> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  // Best-effort detach when product_id is nullable (patch_tr_order_items_product_on_delete.sql).
  const { error: detachError } = await supabase
    .from("tr_order_items")
    .update({ product_id: null })
    .eq("product_id", productId);
  if (detachError) {
    // Expected before the SQL patch (NOT NULL / FK). Hard delete or soft-hide handles next.
  }

  const { error: deleteError } = await supabase
    .from("tr_products")
    .delete()
    .eq("id", productId);

  if (!deleteError) {
    return { mode: "deleted" };
  }

  if (!isForeignKeyViolation(deleteError)) {
    throw deleteError;
  }

  const { error: hideError } = await supabase
    .from("tr_products")
    .update({ status: "hidden", stock: 0 })
    .eq("id", productId);

  if (hideError) throw hideError;

  return { mode: "hidden" };
}

export async function duplicateProductAdmin(
  productId: string,
): Promise<TrProduct> {
  const existing = await getProductByIdAdmin(productId);
  if (!existing) throw new Error("Product not found.");

  return createProductAdmin({
    boutiqueId: existing.boutiqueId,
    title: `${existing.title} (kopya)`,
    description: existing.description,
    priceKurus: existing.priceKurus,
    compareAtPriceKurus: existing.compareAtPriceKurus,
    size: existing.size,
    sizes: existing.sizes,
    colors: existing.colors,
    conditionLabel: existing.conditionLabel,
    category: existing.category,
    images: existing.images,
    marketplaceImages: existing.marketplaceImages,
    lifestyleImages: existing.lifestyleImages,
    catalogBackgroundId: existing.catalogBackgroundId,
    status: "hidden",
    stock: existing.stock,
    sizeStocks: existing.sizeStocks,
    sortOrder: existing.sortOrder,
  });
}

export async function updateProductStatusAdmin(
  productId: string,
  status: TrProductStatus,
): Promise<TrProduct> {
  return updateProductAdmin(productId, { status });
}

export async function markProductsSoldAdmin(productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;

  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { error } = await supabase
    .from("tr_products")
    .update({ status: "sold" })
    .in("id", productIds)
    .eq("status", "available");

  if (error) throw error;
}
