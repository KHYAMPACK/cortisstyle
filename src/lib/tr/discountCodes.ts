import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { mapDiscountCodeRow } from "@/lib/tr/mappers";
import type { TrDiscountCode } from "@/types/tr-marketplace";

export type CreateTrDiscountCodeInput = {
  boutiqueId: string;
  code: string;
  percentOff?: number | null;
  amountOffKurus?: number | null;
  active?: boolean;
  usageLimit?: number | null;
};

export async function listDiscountCodesByBoutiqueIdAdmin(
  boutiqueId: string,
): Promise<TrDiscountCode[]> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_discount_codes")
    .select("*")
    .eq("boutique_id", boutiqueId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) =>
    mapDiscountCodeRow(row as Record<string, unknown>),
  );
}

export async function createDiscountCodeAdmin(
  input: CreateTrDiscountCodeInput,
): Promise<TrDiscountCode> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const code = input.code.trim().toUpperCase();
  if (!code) throw new Error("Kupon kodu zorunlu.");

  const percentOff = input.percentOff ?? null;
  const amountOffKurus = input.amountOffKurus ?? null;
  if (
    (percentOff == null && amountOffKurus == null) ||
    (percentOff != null && amountOffKurus != null)
  ) {
    throw new Error("Yüzde veya tutar indiriminden birini seçin.");
  }

  const { data, error } = await supabase
    .from("tr_discount_codes")
    .insert({
      boutique_id: input.boutiqueId,
      code,
      percent_off: percentOff,
      amount_off_kurus: amountOffKurus,
      active: input.active ?? true,
      usage_limit: input.usageLimit ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;

  return mapDiscountCodeRow(data as Record<string, unknown>);
}

export async function updateDiscountCodeAdmin(
  id: string,
  patch: Partial<{
    active: boolean;
    usageLimit: number | null;
  }>,
): Promise<TrDiscountCode> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const row: Record<string, unknown> = {};
  if (patch.active !== undefined) row.active = patch.active;
  if (patch.usageLimit !== undefined) row.usage_limit = patch.usageLimit;

  const { data, error } = await supabase
    .from("tr_discount_codes")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return mapDiscountCodeRow(data as Record<string, unknown>);
}

export async function getDiscountCodeByIdAdmin(
  id: string,
): Promise<TrDiscountCode | null> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_discount_codes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapDiscountCodeRow(data as Record<string, unknown>);
}

export async function getDiscountCodeForBoutiqueAdmin(
  boutiqueId: string,
  code: string,
): Promise<TrDiscountCode | null> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from("tr_discount_codes")
    .select("*")
    .eq("boutique_id", boutiqueId)
    .eq("code", normalized)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapDiscountCodeRow(data as Record<string, unknown>);
}

export async function incrementDiscountCodeUsageAdmin(
  id: string,
): Promise<boolean> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const existing = await getDiscountCodeByIdAdmin(id);
  if (!existing) return false;

  let query = supabase
    .from("tr_discount_codes")
    .update({ used_count: existing.usedCount + 1 })
    .eq("id", id)
    .eq("used_count", existing.usedCount);

  if (existing.usageLimit != null) {
    query = query.lt("used_count", existing.usageLimit);
  }

  const { data, error } = await query.select("id").maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
