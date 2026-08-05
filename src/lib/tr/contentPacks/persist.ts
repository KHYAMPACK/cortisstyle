import { getServiceSupabase } from "@/lib/supabaseAdmin";
import type {
  CreateTrContentPackInput,
  TrContentPack,
  TrContentPackFormat,
  TrContentPackStatus,
} from "@/lib/tr/contentPacks/types";

function readFormats(value: unknown): TrContentPackFormat[] {
  if (!Array.isArray(value)) return [];
  const out: TrContentPackFormat[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const aspectId = record.aspectId;
    const imageUrl =
      typeof record.imageUrl === "string" ? record.imageUrl.trim() : "";
    const aspectRatio =
      typeof record.aspectRatio === "string" ? record.aspectRatio : "";
    const width = typeof record.width === "number" ? record.width : 0;
    const height = typeof record.height === "number" ? record.height : 0;
    if (
      (aspectId === "feed-square" ||
        aspectId === "feed-portrait" ||
        aspectId === "story-reel") &&
      imageUrl
    ) {
      out.push({
        aspectId,
        imageUrl,
        aspectRatio,
        width,
        height,
      });
    }
  }
  return out;
}

function readStatus(value: unknown): TrContentPackStatus {
  if (value === "queued" || value === "ready" || value === "failed") {
    return value;
  }
  return "failed";
}

export function mapContentPackRow(row: Record<string, unknown>): TrContentPack {
  return {
    id: row.id as string,
    boutiqueId: row.boutique_id as string,
    productId: row.product_id as string,
    status: readStatus(row.status),
    variantImageUrls: Array.isArray(row.variant_image_urls)
      ? row.variant_image_urls.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : [],
    formats: readFormats(row.formats),
    caption: typeof row.caption === "string" ? row.caption : "",
    deepLink: typeof row.deep_link === "string" ? row.deep_link : "",
    usedAiLifestyle: Boolean(row.used_ai_lifestyle),
    error: typeof row.error === "string" ? row.error : null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listContentPacksByBoutiqueIdAdmin(
  boutiqueId: string,
): Promise<TrContentPack[]> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_content_packs")
    .select("*")
    .eq("boutique_id", boutiqueId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) =>
    mapContentPackRow(row as Record<string, unknown>),
  );
}

export async function getContentPackByIdAdmin(
  packId: string,
): Promise<TrContentPack | null> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_content_packs")
    .select("*")
    .eq("id", packId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapContentPackRow(data as Record<string, unknown>);
}

export async function createContentPackAdmin(
  input: CreateTrContentPackInput,
): Promise<TrContentPack> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_content_packs")
    .insert({
      boutique_id: input.boutiqueId,
      product_id: input.productId,
      status: input.status,
      variant_image_urls: input.variantImageUrls,
      formats: input.formats,
      caption: input.caption,
      deep_link: input.deepLink,
      used_ai_lifestyle: input.usedAiLifestyle,
      error: input.error ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;

  return mapContentPackRow(data as Record<string, unknown>);
}
