import { getServiceSupabase } from "@/lib/supabaseAdmin";
import type { CampaignInput } from "@/lib/tr/discounts/campaignRules";
import {
  mapDiscountCampaignRow,
  type TrDiscountCampaign,
} from "@/lib/tr/discounts/types";

/**
 * A boutique's discount campaigns (İndirimler): reading, writing, and their product
 * scope. Server only, through the service role. Reads are tolerant — before
 * `patch_discount_campaigns.sql` is applied they behave as "no campaigns" so the
 * panel never breaks; writes report a missing schema instead of failing silently.
 *
 * M2 covers `kind: 'automatic'` only; the Kuponlar tab (`kind: 'code'`) lands in M4
 * alongside `tr_discount_campaign_codes`.
 */

type DbError = { code?: string; message?: string };

function isSchemaMissing(error: DbError): boolean {
  if (["42703", "42P01", "PGRST204", "PGRST205"].includes(error.code ?? "")) {
    return true;
  }
  return /does not exist|schema cache|could not find/i.test(error.message ?? "");
}

const SCHEMA_HINT =
  "Kampanyalar kullanılamıyor: veritabanı güncellemesi (patch_discount_campaigns.sql) henüz uygulanmamış.";

export class DiscountCampaignError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 = 400,
  ) {
    super(message);
    this.name = "DiscountCampaignError";
  }
}

function client() {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

// ---------------------------------------------------------------- reads

async function loadProductScope(campaignIds: string[]): Promise<Map<string, string[]>> {
  const byCampaign = new Map<string, string[]>();
  if (campaignIds.length === 0) return byCampaign;
  const { data, error } = await client()
    .from("tr_discount_campaign_products")
    .select("campaign_id, product_id")
    .in("campaign_id", campaignIds);
  if (error) {
    if (!isSchemaMissing(error)) throw error;
    return byCampaign;
  }
  for (const row of data ?? []) {
    const campaignId = String(row.campaign_id);
    const list = byCampaign.get(campaignId) ?? [];
    list.push(String(row.product_id));
    byCampaign.set(campaignId, list);
  }
  return byCampaign;
}

/** Every campaign of a boutique, both kinds, newest first. */
export async function listCampaigns(boutiqueId: string): Promise<TrDiscountCampaign[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tr_discount_campaigns")
    .select("*")
    .eq("boutique_id", boutiqueId)
    .order("created_at", { ascending: false });
  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/discount-campaigns] list failed:", error.message);
    }
    return [];
  }
  const rows = data ?? [];
  const scope = await loadProductScope(rows.map((row) => String(row.id)));
  return rows.map((row) =>
    mapDiscountCampaignRow(row as Record<string, unknown>, scope.get(String(row.id)) ?? []),
  );
}

export async function getCampaign(id: string): Promise<TrDiscountCampaign | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("tr_discount_campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/discount-campaigns] lookup failed:", error.message);
    }
    return null;
  }
  if (!data) return null;
  const scope = await loadProductScope([id]);
  return mapDiscountCampaignRow(data as Record<string, unknown>, scope.get(id) ?? []);
}

// ---------------------------------------------------------------- writes

function campaignRow(input: CampaignInput): Record<string, unknown> {
  return {
    kind: input.kind,
    title: input.title,
    discount_type: input.discountType,
    percent_off: input.percentOff,
    amount_off_kurus: input.amountOffKurus,
    scope_all: input.scopeAll,
    include_sale_items: input.includeSaleItems,
    min_subtotal_kurus: input.minSubtotalKurus,
    max_subtotal_kurus: input.maxSubtotalKurus,
    min_items: input.minItems,
    max_items: input.maxItems,
    stackable: input.stackable,
    usage_limit_total: input.usageLimitTotal,
    usage_limit_per_customer: input.usageLimitPerCustomer,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    active: input.active,
  };
}

/** Replace a campaign's product scope to match `input` (empty when `scopeAll`). */
async function syncProductScope(campaignId: string, input: CampaignInput): Promise<void> {
  const supabase = client();
  const { error: deleteError } = await supabase
    .from("tr_discount_campaign_products")
    .delete()
    .eq("campaign_id", campaignId);
  if (deleteError) {
    if (isSchemaMissing(deleteError)) throw new DiscountCampaignError(SCHEMA_HINT);
    throw deleteError;
  }
  if (input.scopeAll || input.productIds.length === 0) return;
  const { error: insertError } = await supabase.from("tr_discount_campaign_products").insert(
    input.productIds.map((productId) => ({ campaign_id: campaignId, product_id: productId })),
  );
  if (insertError) {
    if (isSchemaMissing(insertError)) throw new DiscountCampaignError(SCHEMA_HINT);
    throw insertError;
  }
}

export async function createCampaign(
  boutiqueId: string,
  input: CampaignInput,
): Promise<TrDiscountCampaign> {
  const supabase = client();
  const { data, error } = await supabase
    .from("tr_discount_campaigns")
    .insert({ boutique_id: boutiqueId, ...campaignRow(input) })
    .select("*")
    .single();
  if (error) {
    if (isSchemaMissing(error)) throw new DiscountCampaignError(SCHEMA_HINT);
    throw error;
  }
  const campaign = mapDiscountCampaignRow(data as Record<string, unknown>);
  await syncProductScope(campaign.id, input);
  return { ...campaign, productIds: input.scopeAll ? [] : input.productIds };
}

export async function updateCampaign(
  id: string,
  input: CampaignInput,
): Promise<TrDiscountCampaign> {
  const supabase = client();
  const { data, error } = await supabase
    .from("tr_discount_campaigns")
    .update(campaignRow(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (isSchemaMissing(error)) throw new DiscountCampaignError(SCHEMA_HINT);
    throw error;
  }
  const campaign = mapDiscountCampaignRow(data as Record<string, unknown>);
  await syncProductScope(id, input);
  return { ...campaign, productIds: input.scopeAll ? [] : input.productIds };
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await client().from("tr_discount_campaigns").delete().eq("id", id);
  if (error) {
    if (isSchemaMissing(error)) throw new DiscountCampaignError(SCHEMA_HINT);
    throw error;
  }
}
