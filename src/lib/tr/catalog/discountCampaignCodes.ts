import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { generateCampaignCodes, type CodeLimitsInput } from "@/lib/tr/discounts/codeRules";
import {
  mapDiscountCampaignCodeRow,
  type TrDiscountCampaignCode,
} from "@/lib/tr/discounts/types";
import { DiscountCampaignError } from "@/lib/tr/catalog/discountCampaigns";

/**
 * A `kind: 'code'` campaign's Kuponlar tab: the redeemable codes themselves, and the
 * checkout-side lookup/usage-increment. Server only, through the service role. Reads
 * are tolerant — before `patch_discount_campaigns.sql` they behave as "no codes";
 * writes report a missing schema instead of failing silently.
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
  "Kuponlar kullanılamıyor: veritabanı güncellemesi (patch_discount_campaigns.sql) henüz uygulanmamış.";

function client() {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

function limitsRow(input: CodeLimitsInput): Record<string, unknown> {
  return {
    usage_limit_total: input.usageLimitTotal,
    usage_limit_per_customer: input.usageLimitPerCustomer,
  };
}

// ---------------------------------------------------------------- reads

/** A campaign's codes, oldest first (the order they were added). */
export async function listCampaignCodes(
  campaignId: string,
): Promise<TrDiscountCampaignCode[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tr_discount_campaign_codes")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });
  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/discount-campaign-codes] list failed:", error.message);
    }
    return [];
  }
  return (data ?? []).map((row) => mapDiscountCampaignCodeRow(row as Record<string, unknown>));
}

/** A boutique's already-taken codes, for collision-checking a generated batch. */
async function listTakenCodes(boutiqueId: string): Promise<Set<string>> {
  const supabase = getServiceSupabase();
  if (!supabase) return new Set();
  const { data, error } = await supabase
    .from("tr_discount_campaign_codes")
    .select("code")
    .eq("boutique_id", boutiqueId);
  if (error) return new Set();
  return new Set((data ?? []).map((row) => String(row.code)));
}

/** The checkout-side lookup: this boutique's code, whichever campaign it belongs to. */
export async function findCampaignCodeByCode(
  boutiqueId: string,
  code: string,
): Promise<TrDiscountCampaignCode | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("tr_discount_campaign_codes")
    .select("*")
    .eq("boutique_id", boutiqueId)
    .eq("code", code)
    .maybeSingle();
  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/discount-campaign-codes] lookup failed:", error.message);
    }
    return null;
  }
  return data ? mapDiscountCampaignCodeRow(data as Record<string, unknown>) : null;
}

/**
 * How many of a customer's non-failed, non-refunded orders already redeemed this
 * exact code — what a code's own Müşteri başına kullanım limiti is checked against.
 * Reuses the existing `tr_orders.discount_code` column; no new table needed.
 */
export async function countCustomerCodeUses(
  code: string,
  customerEmail: string,
): Promise<number> {
  const supabase = getServiceSupabase();
  const email = customerEmail.trim().toLowerCase();
  if (!supabase || !email) return 0;
  const { data, error } = await supabase
    .from("tr_orders")
    .select("payment_status")
    .eq("customer_email", email)
    .eq("discount_code", code);
  if (error) {
    console.error("[tr/discount-campaign-codes] customer usage count failed:", error.message);
    return 0;
  }
  return (data ?? []).filter(
    (row) => row.payment_status !== "failed" && row.payment_status !== "refunded",
  ).length;
}

// ---------------------------------------------------------------- writes

export async function addCustomCode(
  campaignId: string,
  boutiqueId: string,
  input: { code: string } & CodeLimitsInput,
): Promise<TrDiscountCampaignCode> {
  const { data, error } = await client()
    .from("tr_discount_campaign_codes")
    .insert({
      campaign_id: campaignId,
      boutique_id: boutiqueId,
      code: input.code,
      ...limitsRow(input),
    })
    .select("*")
    .single();
  if (error) {
    if (isSchemaMissing(error)) throw new DiscountCampaignError(SCHEMA_HINT);
    if (isUniqueViolation(error)) {
      throw new DiscountCampaignError(`"${input.code}" kodu bu butikte zaten kullanılıyor.`, 409);
    }
    throw error;
  }
  return mapDiscountCampaignCodeRow(data as Record<string, unknown>);
}

/** "Otomatik Kod Üret": makes `count` unique codes from `prefix` and inserts them all. */
export async function addGeneratedCodes(
  campaignId: string,
  boutiqueId: string,
  input: { prefix: string; count: number } & CodeLimitsInput,
): Promise<TrDiscountCampaignCode[]> {
  const taken = await listTakenCodes(boutiqueId);
  const codes = generateCampaignCodes(input.prefix, input.count, taken);
  const { data, error } = await client()
    .from("tr_discount_campaign_codes")
    .insert(
      codes.map((code) => ({
        campaign_id: campaignId,
        boutique_id: boutiqueId,
        code,
        ...limitsRow(input),
      })),
    )
    .select("*");
  if (error) {
    if (isSchemaMissing(error)) throw new DiscountCampaignError(SCHEMA_HINT);
    if (isUniqueViolation(error)) {
      // Lost a race with another request generating at the same moment.
      throw new DiscountCampaignError(
        "Kupon kodları üretilirken bir çakışma oldu, tekrar deneyin.",
        409,
      );
    }
    throw error;
  }
  return (data ?? []).map((row) => mapDiscountCampaignCodeRow(row as Record<string, unknown>));
}

export async function deleteCampaignCode(id: string): Promise<void> {
  const { error } = await client().from("tr_discount_campaign_codes").delete().eq("id", id);
  if (error) {
    if (isSchemaMissing(error)) throw new DiscountCampaignError(SCHEMA_HINT);
    throw error;
  }
}

export async function getCampaignCode(id: string): Promise<TrDiscountCampaignCode | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("tr_discount_campaign_codes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (!isSchemaMissing(error)) {
      console.error("[tr/discount-campaign-codes] lookup by id failed:", error.message);
    }
    return null;
  }
  return data ? mapDiscountCampaignCodeRow(data as Record<string, unknown>) : null;
}

/** Burns one use of a code's own Toplam kullanım limiti after a sale completes. */
export async function incrementCampaignCodeUsage(codeId: string): Promise<void> {
  const code = await getCampaignCode(codeId);
  if (!code) return;
  let query = client()
    .from("tr_discount_campaign_codes")
    .update({ used_count: code.usedCount + 1 })
    .eq("id", codeId)
    .eq("used_count", code.usedCount);
  if (code.usageLimitTotal != null) {
    query = query.lt("used_count", code.usageLimitTotal);
  }
  const { error } = await query;
  if (error && !isSchemaMissing(error)) {
    console.error("[tr/discount-campaign-codes] usage increment failed:", error.message);
  }
}
