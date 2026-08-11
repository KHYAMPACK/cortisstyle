import { getServiceSupabase } from "@/lib/supabaseAdmin";
import {
  mapInvoiceRow,
  normalizeBuyerTaxId,
} from "@/lib/tr/invoiceFields";
import { getOrderByIdAdmin } from "@/lib/tr/orders";
import type {
  TrInvoice,
  TrInvoiceStatus,
  TrOrderWithItems,
} from "@/types/tr-marketplace";

function boutiqueLines(order: TrOrderWithItems, boutiqueId: string) {
  return order.items.filter((item) => item.boutiqueId === boutiqueId);
}

/**
 * Ensure a draft invoice exists for this boutique's share of the order.
 * Idempotent on (boutique_id, order_id).
 */
export async function ensureDraftInvoiceForBoutiqueOrder(
  boutiqueId: string,
  orderId: string,
): Promise<TrInvoice> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const existing = await getInvoiceByBoutiqueOrderAdmin(boutiqueId, orderId);
  if (existing) return existing;

  const order = await getOrderByIdAdmin(orderId);
  if (!order) {
    throw new Error("Sipariş bulunamadı.");
  }

  const lines = boutiqueLines(order, boutiqueId);
  if (lines.length === 0) {
    throw new Error("Bu siparişte butik kalemi yok.");
  }

  const totalKurus = lines.reduce(
    (sum, item) => sum + item.priceKurus * item.quantity,
    0,
  );

  const { data, error } = await supabase
    .from("tr_invoices")
    .insert({
      boutique_id: boutiqueId,
      order_id: orderId,
      status: "draft",
      buyer_name: order.customerName,
      buyer_email: order.customerEmail,
      invoice_type: order.invoiceType,
      buyer_tax_id: normalizeBuyerTaxId(order.buyerTaxId),
      buyer_tax_office: order.buyerTaxOffice?.trim() || null,
      buyer_title: order.buyerTitle?.trim() || null,
      total_kurus: totalKurus,
      line_summary: lines.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        priceKurus: item.priceKurus,
        size: item.size,
      })),
      notes: "KDV dahil (detay muhasebe sürecinde).",
    })
    .select("*")
    .single();

  if (error) {
    // Race: another request inserted first.
    if (error.code === "23505") {
      const raced = await getInvoiceByBoutiqueOrderAdmin(boutiqueId, orderId);
      if (raced) return raced;
    }
    throw error;
  }

  return mapInvoiceRow(data as Record<string, unknown>);
}

export async function getInvoiceByBoutiqueOrderAdmin(
  boutiqueId: string,
  orderId: string,
): Promise<TrInvoice | null> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_invoices")
    .select("*")
    .eq("boutique_id", boutiqueId)
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapInvoiceRow(data as Record<string, unknown>);
}

export async function listInvoicesByBoutiqueIdAdmin(
  boutiqueId: string,
): Promise<TrInvoice[]> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_invoices")
    .select("*")
    .eq("boutique_id", boutiqueId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) =>
    mapInvoiceRow(row as Record<string, unknown>),
  );
}

export async function getInvoiceByIdAdmin(
  invoiceId: string,
): Promise<TrInvoice | null> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapInvoiceRow(data as Record<string, unknown>);
}

export async function updateInvoiceAdmin(
  invoiceId: string,
  patch: {
    status?: TrInvoiceStatus;
    externalInvoiceNo?: string | null;
    notes?: string | null;
  },
): Promise<TrInvoice> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const existing = await getInvoiceByIdAdmin(invoiceId);
  if (!existing) {
    throw new Error("Fatura kaydı bulunamadı.");
  }

  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) {
    row.status = patch.status;
    if (patch.status === "issued_offline" && !existing.issuedAt) {
      row.issued_at = new Date().toISOString();
    }
    if (patch.status === "draft") {
      row.issued_at = null;
    }
  }
  if (patch.externalInvoiceNo !== undefined) {
    row.external_invoice_no = patch.externalInvoiceNo?.trim() || null;
  }
  if (patch.notes !== undefined) {
    row.notes = patch.notes?.trim() || null;
  }

  if (Object.keys(row).length === 0) {
    return existing;
  }

  const { data, error } = await supabase
    .from("tr_invoices")
    .update(row)
    .eq("id", invoiceId)
    .select("*")
    .single();

  if (error) throw error;
  return mapInvoiceRow(data as Record<string, unknown>);
}
