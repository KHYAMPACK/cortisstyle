import {
  readManualOrderDraft,
  type ManualOrderDraft,
} from "@/lib/tr/orders/manualOrder";

/**
 * A saved, unfinished manual order ("Taslak"). Client-safe: the list page and the
 * editor read the same shape the API returns.
 */
export interface TrOrderDraft {
  id: string;
  boutiqueId: string;
  /** Null until a customer is chosen, or once that customer was deleted. */
  customerId: string | null;
  /** The customer's name when the draft was last saved — what the list shows. */
  customerName: string | null;
  /** The editor's whole state. */
  order: ManualOrderDraft;
  /** The total when last saved, at the prices of that moment (drafts store no prices). */
  totalKurus: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

/** The short code a draft goes by in the list: the first 8 characters of its id, in capitals. */
export function orderDraftReference(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function mapOrderDraftRow(row: Record<string, unknown>): TrOrderDraft {
  const read = readManualOrderDraft(row.payload);
  return {
    id: String(row.id),
    boutiqueId: String(row.boutique_id),
    customerId:
      typeof row.customer_id === "string" && row.customer_id ? row.customer_id : null,
    customerName:
      typeof row.customer_name === "string" && row.customer_name ? row.customer_name : null,
    // A payload that no longer reads (a limit changed) opens as an empty order, not an error.
    order: read.ok
      ? read.draft
      : { customerId: null, addressId: null, lines: [], adjustment: null, shippingFeeKurus: 0, customerNote: "", paymentStatus: "pending" },
    totalKurus: typeof row.total_kurus === "number" ? row.total_kurus : 0,
    itemCount: typeof row.item_count === "number" ? row.item_count : 0,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}
