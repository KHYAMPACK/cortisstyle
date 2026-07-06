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
} from "@/types/tr-marketplace";

const PUBLIC_PRODUCT_COLUMNS =
  "id, boutique_id, title, description, price_kurus, size, condition_label, category, images, status, sort_order, created_at, updated_at";

function productInsertRow(input: CreateTrProductInput) {
  return {
    boutique_id: input.boutiqueId,
    title: input.title.trim(),
    description: input.description?.trim() ?? null,
    price_kurus: input.priceKurus,
    size: input.size?.trim() ?? null,
    condition_label: input.conditionLabel?.trim() ?? null,
    category: input.category?.trim() ?? null,
    images: input.images ?? [],
    status: input.status ?? "available",
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

export async function updateProductStatusAdmin(
  productId: string,
  status: TrProductStatus,
): Promise<TrProduct> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_products")
    .update({ status })
    .eq("id", productId)
    .select("*")
    .single();

  if (error) throw error;

  return mapProductRow(data as Record<string, unknown>);
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
