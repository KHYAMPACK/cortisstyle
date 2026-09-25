import { getServiceSupabase } from "@/lib/supabaseAdmin";
import {
  customerNameForDraft,
  ManualOrderError,
  priceManualLines,
} from "@/lib/tr/commerce/manualOrder";
import {
  computeManualTotals,
  isManualOrderBlank,
  type ManualOrderDraft,
} from "@/lib/tr/orders/manualOrder";
import { mapOrderDraftRow, type TrOrderDraft } from "@/lib/tr/orders/orderDraft";

/**
 * Saved unfinished manual orders (Taslaklar). Server only, service role. A draft stores
 * the editor's state and a summary for the list; it holds no stock and no prices.
 */

const TABLE = "tr_order_drafts";

/** The patch that creates the table has not been applied to this database. */
export class OrderDraftsNotSetUpError extends Error {
  constructor() {
    super("Taslaklar henüz kurulmadı. Destek ekibiyle iletişime geçin.");
    this.name = "OrderDraftsNotSetUpError";
  }
}

function isMissingTable(error: unknown): boolean {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  return code === "42P01" || code === "PGRST205";
}

function service() {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

function fail(error: unknown): never {
  if (isMissingTable(error)) throw new OrderDraftsNotSetUpError();
  throw error;
}

/** What the list shows, worked out at the catalog's prices of this moment. */
async function summarize(boutiqueId: string, order: ManualOrderDraft) {
  if (isManualOrderBlank(order)) {
    throw new ManualOrderError("Boş bir taslak kaydedilemez.");
  }
  const customerName = await customerNameForDraft(boutiqueId, order.customerId);
  if (order.customerId && !customerName) {
    throw new ManualOrderError("Müşteri bulunamadı.", 404);
  }
  const { lines } = await priceManualLines({
    boutiqueId,
    lines: order.lines,
    enforceStock: false,
  });
  const totals = computeManualTotals({
    lines,
    adjustment: order.adjustment,
    shippingFeeKurus: order.shippingFeeKurus,
  });
  return {
    customer_id: order.customerId,
    customer_name: customerName,
    payload: order,
    total_kurus: totals.totalKurus,
    item_count: order.lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}

/** A boutique's drafts, most recently changed first. */
export async function listOrderDraftsAdmin(boutiqueId: string): Promise<TrOrderDraft[]> {
  const { data, error } = await service()
    .from(TABLE)
    .select("*")
    .eq("boutique_id", boutiqueId)
    .order("updated_at", { ascending: false });
  if (error) fail(error);
  return (data ?? []).map((row) => mapOrderDraftRow(row as Record<string, unknown>));
}

export async function getOrderDraftAdmin(
  boutiqueId: string,
  draftId: string,
): Promise<TrOrderDraft | null> {
  const { data, error } = await service()
    .from(TABLE)
    .select("*")
    .eq("id", draftId)
    .eq("boutique_id", boutiqueId)
    .maybeSingle();
  if (error) fail(error);
  return data ? mapOrderDraftRow(data as Record<string, unknown>) : null;
}

export async function createOrderDraftAdmin(
  boutiqueId: string,
  order: ManualOrderDraft,
): Promise<TrOrderDraft> {
  const row = await summarize(boutiqueId, order);
  const { data, error } = await service()
    .from(TABLE)
    .insert({ boutique_id: boutiqueId, ...row })
    .select("*")
    .single();
  if (error) fail(error);
  return mapOrderDraftRow(data as Record<string, unknown>);
}

export async function updateOrderDraftAdmin(
  boutiqueId: string,
  draftId: string,
  order: ManualOrderDraft,
): Promise<TrOrderDraft | null> {
  const row = await summarize(boutiqueId, order);
  const { data, error } = await service()
    .from(TABLE)
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", draftId)
    .eq("boutique_id", boutiqueId)
    .select("*")
    .maybeSingle();
  if (error) fail(error);
  return data ? mapOrderDraftRow(data as Record<string, unknown>) : null;
}

/** Returns whether a draft was removed. */
export async function deleteOrderDraftAdmin(
  boutiqueId: string,
  draftId: string,
): Promise<boolean> {
  const { data, error } = await service()
    .from(TABLE)
    .delete()
    .eq("id", draftId)
    .eq("boutique_id", boutiqueId)
    .select("id");
  if (error) fail(error);
  return (data ?? []).length > 0;
}
