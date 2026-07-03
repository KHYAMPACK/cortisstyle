import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudioImportCacheRecord, StudioImportPipeline } from "@/types/studioImportCache";

interface ImportCacheRow {
  id: string;
  user_id: string;
  source_hash: string;
  pipeline: StudioImportPipeline;
  asset_url: string;
  storage_path: string;
  product_name: string | null;
  category: string | null;
  brand: string | null;
  item_id_slug: string;
  width: number;
  height: number;
  source_url: string | null;
  source_filename: string | null;
  shop_url: string | null;
  display_model: string | null;
  est_price_range: string | null;
  budget_alternative_url: string | null;
  rarity_score: number;
  created_at: string;
  last_used_at: string;
}

function mapImportCacheRow(row: ImportCacheRow): StudioImportCacheRecord {
  return {
    id: row.id,
    sourceHash: row.source_hash,
    pipeline: row.pipeline,
    assetUrl: row.asset_url,
    storagePath: row.storage_path,
    productName: row.product_name,
    category: row.category,
    brand: row.brand,
    itemIdSlug: row.item_id_slug,
    width: row.width,
    height: row.height,
    sourceUrl: row.source_url,
    sourceFilename: row.source_filename,
    shopUrl: row.shop_url,
    displayModel: row.display_model,
    estPriceRange: row.est_price_range,
    budgetAlternativeUrl: row.budget_alternative_url,
    rarityScore: row.rarity_score ?? 1,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  };
}

export async function lookupStudioImportCache(
  supabase: SupabaseClient,
  userId: string,
  sourceHash: string,
  pipeline: StudioImportPipeline,
): Promise<StudioImportCacheRecord | null> {
  const { data, error } = await supabase
    .from("studio_import_cache")
    .select("*")
    .eq("user_id", userId)
    .eq("source_hash", sourceHash)
    .eq("pipeline", pipeline)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const record = mapImportCacheRow(data as ImportCacheRow);

  await supabase
    .from("studio_import_cache")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", record.id)
    .eq("user_id", userId);

  return record;
}

export interface RegisterStudioImportCacheInput {
  sourceHash: string;
  pipeline: StudioImportPipeline;
  assetUrl: string;
  storagePath: string;
  productName?: string | null;
  category?: string | null;
  brand?: string | null;
  itemIdSlug: string;
  width: number;
  height: number;
  sourceUrl?: string | null;
  sourceFilename?: string | null;
  shopUrl?: string | null;
  displayModel?: string | null;
  estPriceRange?: string | null;
  budgetAlternativeUrl?: string | null;
  rarityScore?: number;
}

export async function registerStudioImportCache(
  supabase: SupabaseClient,
  userId: string,
  input: RegisterStudioImportCacheInput,
): Promise<StudioImportCacheRecord> {
  const row = {
    user_id: userId,
    source_hash: input.sourceHash,
    pipeline: input.pipeline,
    asset_url: input.assetUrl,
    storage_path: input.storagePath,
    product_name: input.productName ?? null,
    category: input.category ?? null,
    brand: input.brand ?? null,
    item_id_slug: input.itemIdSlug,
    width: input.width,
    height: input.height,
    source_url: input.sourceUrl ?? null,
    source_filename: input.sourceFilename ?? null,
    shop_url: input.shopUrl ?? null,
    display_model: input.displayModel ?? null,
    est_price_range: input.estPriceRange ?? null,
    budget_alternative_url: input.budgetAlternativeUrl ?? null,
    rarity_score: input.rarityScore ?? 1,
    last_used_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("studio_import_cache")
    .upsert(row, { onConflict: "user_id,source_hash,pipeline" })
    .select("*")
    .single();

  if (error) throw error;

  return mapImportCacheRow(data as ImportCacheRow);
}

export interface UpdateStudioImportCacheMetadataInput {
  productName?: string | null;
  category?: string | null;
  brand?: string | null;
  shopUrl?: string | null;
  displayModel?: string | null;
  estPriceRange?: string | null;
  budgetAlternativeUrl?: string | null;
  rarityScore?: number;
}

export async function updateStudioImportCacheMetadata(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  input: UpdateStudioImportCacheMetadataInput,
): Promise<StudioImportCacheRecord | null> {
  const patch: Record<string, unknown> = {
    last_used_at: new Date().toISOString(),
  };

  if (input.productName !== undefined) patch.product_name = input.productName;
  if (input.category !== undefined) patch.category = input.category;
  if (input.brand !== undefined) patch.brand = input.brand;
  if (input.shopUrl !== undefined) patch.shop_url = input.shopUrl;
  if (input.displayModel !== undefined) patch.display_model = input.displayModel;
  if (input.estPriceRange !== undefined) patch.est_price_range = input.estPriceRange;
  if (input.budgetAlternativeUrl !== undefined) patch.budget_alternative_url = input.budgetAlternativeUrl;
  if (input.rarityScore !== undefined) patch.rarity_score = input.rarityScore;

  const { data, error } = await supabase
    .from("studio_import_cache")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapImportCacheRow(data as ImportCacheRow);
}

export async function listStudioImportCache(
  supabase: SupabaseClient,
  userId: string,
  limit = 48,
): Promise<StudioImportCacheRecord[]> {
  const { data, error } = await supabase
    .from("studio_import_cache")
    .select("*")
    .eq("user_id", userId)
    .order("last_used_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data as ImportCacheRow[]).map(mapImportCacheRow);
}

export async function touchStudioImportCacheById(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<StudioImportCacheRecord | null> {
  const { data, error } = await supabase
    .from("studio_import_cache")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapImportCacheRow(data as ImportCacheRow);
}
