import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicBoutiqueById, getPublicBoutiqueBySlug } from "@/lib/tr/boutiques";
import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { mapProductRow } from "@/lib/tr/mappers";
import type {
  CreateTrProductInput,
  TrProduct,
  TrProductStatus,
  TrProductWithBoutique,
  UpdateTrProductInput,
} from "@/types/tr-marketplace";

const PUBLIC_PRODUCT_COLUMNS =
  "id, boutique_id, title, description, price_kurus, compare_at_price_kurus, size, sizes, colors, condition_label, category, images, marketplace_images, status, stock, sort_order, created_at, updated_at";

function productInsertRow(input: CreateTrProductInput) {
  return {
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
    status: input.status ?? "available",
    stock: input.stock ?? 1,
    sort_order: input.sortOrder ?? 0,
  };
}

export async function listPublicProductsByBoutiqueSlug(
  boutiqueSlug: string,
  client?: SupabaseClient,
): Promise<TrProductWithBoutique[]> {
  const boutique = await getPublicBoutiqueBySlug(boutiqueSlug, client);
  if (!boutique) return [];

  return listPublicProductsByBoutiqueId(boutique.id, boutique, client);
}

export async function listPublicProductsByBoutiqueId(
  boutiqueId: string,
  boutique: TrProductWithBoutique["boutique"],
  client?: SupabaseClient,
): Promise<TrProductWithBoutique[]> {
  const supabase = client ?? getSupabaseClient();

  const { data, error } = await supabase
    .from("tr_products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("boutique_id", boutiqueId)
    .in("status", ["available", "sold"])
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...mapProductRow(row as Record<string, unknown>),
    boutique,
  }));
}

export async function getPublicProductById(
  productId: string,
  client?: SupabaseClient,
): Promise<TrProductWithBoutique | null> {
  const supabase = client ?? getSupabaseClient();

  const { data, error } = await supabase
    .from("tr_products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("id", productId)
    .in("status", ["available", "sold"])
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const product = mapProductRow(data as Record<string, unknown>);
  const boutique = await getPublicBoutiqueById(product.boutiqueId, client);
  if (!boutique) return null;

  return { ...product, boutique };
}

/** All available items from verified boutiques — for marketplace browse / outfit builder. */
export async function listPublicAvailableProducts(
  client?: SupabaseClient,
): Promise<TrProductWithBoutique[]> {
  const supabase = client ?? getSupabaseClient();

  const { data, error } = await supabase
    .from("tr_products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("status", "available")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const products: TrProductWithBoutique[] = [];
  for (const row of data ?? []) {
    const product = mapProductRow(row as Record<string, unknown>);
    const boutique = await getPublicBoutiqueById(product.boutiqueId, client);
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

  const { data, error } = await supabase
    .from("tr_products")
    .insert(productInsertRow(input))
    .select("*")
    .single();

  if (error) throw error;

  return mapProductRow(data as Record<string, unknown>);
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
  if (input.status !== undefined) row.status = input.status;
  if (input.stock !== undefined) row.stock = input.stock;
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

  if (error) throw error;

  return mapProductRow(data as Record<string, unknown>);
}

export async function deleteProductAdmin(productId: string): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { error } = await supabase
    .from("tr_products")
    .delete()
    .eq("id", productId);

  if (error) throw error;
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
    status: "hidden",
    stock: existing.stock,
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
