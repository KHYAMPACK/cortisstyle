import type {
  TrInvoice,
  TrInvoiceLineSummary,
  TrInvoiceStatus,
  TrInvoiceType,
} from "@/types/tr-marketplace";

function readInvoiceType(value: unknown): TrInvoiceType {
  return value === "corporate" ? "corporate" : "individual";
}

function readInvoiceStatus(value: unknown): TrInvoiceStatus {
  if (value === "issued_offline" || value === "void" || value === "draft") {
    return value;
  }
  return "draft";
}

function readLineSummary(value: unknown): TrInvoiceLineSummary[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as Record<string, unknown>;
      const title = typeof row.title === "string" ? row.title.trim() : "";
      if (!title) return null;
      const quantity =
        typeof row.quantity === "number" && row.quantity > 0
          ? Math.floor(row.quantity)
          : 1;
      const priceKurus =
        typeof row.priceKurus === "number"
          ? row.priceKurus
          : typeof row.price_kurus === "number"
            ? row.price_kurus
            : 0;
      const sizeRaw = row.size;
      return {
        title,
        quantity,
        priceKurus,
        size:
          typeof sizeRaw === "string" && sizeRaw.trim()
            ? sizeRaw.trim()
            : null,
      } satisfies TrInvoiceLineSummary;
    })
    .filter((line): line is TrInvoiceLineSummary => line !== null);
}

export function mapInvoiceRow(row: Record<string, unknown>): TrInvoice {
  return {
    id: row.id as string,
    boutiqueId: row.boutique_id as string,
    orderId: row.order_id as string,
    status: readInvoiceStatus(row.status),
    buyerName: row.buyer_name as string,
    buyerEmail: row.buyer_email as string,
    invoiceType: readInvoiceType(row.invoice_type),
    buyerTaxId: (row.buyer_tax_id as string | null) ?? null,
    buyerTaxOffice: (row.buyer_tax_office as string | null) ?? null,
    buyerTitle: (row.buyer_title as string | null) ?? null,
    totalKurus: row.total_kurus as number,
    lineSummary: readLineSummary(row.line_summary),
    externalInvoiceNo: (row.external_invoice_no as string | null) ?? null,
    issuedAt: (row.issued_at as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    pdfUrl: (row.pdf_url as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Digits-only tax id; empty → null. */
export function normalizeBuyerTaxId(value: string | null | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits || null;
}

export function validateCheckoutInvoiceFields(input: {
  invoiceType?: TrInvoiceType | string | null;
  buyerTaxId?: string | null;
  buyerTaxOffice?: string | null;
  buyerTitle?: string | null;
}): string | null {
  const type: TrInvoiceType =
    input.invoiceType === "corporate" ? "corporate" : "individual";
  const taxId = normalizeBuyerTaxId(input.buyerTaxId);
  if (type === "corporate") {
    if (!input.buyerTitle?.trim()) {
      return "Kurumsal fatura için unvan gerekli.";
    }
    if (!taxId || taxId.length !== 10) {
      return "Kurumsal fatura için 10 haneli VKN girin.";
    }
    if (!input.buyerTaxOffice?.trim()) {
      return "Kurumsal fatura için vergi dairesi gerekli.";
    }
  } else if (taxId && taxId.length !== 11) {
    return "Bireysel fatura için TCKN 11 hane olmalıdır (veya boş bırakın).";
  }
  return null;
}
