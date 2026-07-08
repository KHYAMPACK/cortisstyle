import type {
  TrBoutique,
  TrBoutiquePublic,
  TrOrder,
  TrOrderItem,
  TrProduct,
  TrProductColor,
  TrShippingAddress,
} from "@/types/tr-marketplace";

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function readProductColors(value: unknown): TrProductColor[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      const hex = typeof record.hex === "string" ? record.hex.trim() : "";
      if (!name || !hex) return null;
      return { name, hex };
    })
    .filter((entry): entry is TrProductColor => entry !== null);
}

function readShippingAddress(value: unknown): TrShippingAddress {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid shipping address.");
  }

  const record = value as Record<string, unknown>;
  const line1 = typeof record.line1 === "string" ? record.line1.trim() : "";
  const district = typeof record.district === "string" ? record.district.trim() : "";
  const city = typeof record.city === "string" ? record.city.trim() : "";
  const postalCode =
    typeof record.postalCode === "string" ? record.postalCode.trim() : "";
  const country =
    typeof record.country === "string" && record.country.trim()
      ? record.country.trim()
      : "TR";

  if (!line1 || !district || !city || !postalCode) {
    throw new Error("Shipping address is incomplete.");
  }

  return {
    line1,
    line2:
      typeof record.line2 === "string" && record.line2.trim()
        ? record.line2.trim()
        : undefined,
    district,
    city,
    postalCode,
    country,
  };
}

export function mapBoutiqueRow(row: Record<string, unknown>): TrBoutique {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    legalName: (row.legal_name as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    logoUrl: (row.logo_url as string | null) ?? null,
    whatsappPhone: (row.whatsapp_phone as string | null) ?? null,
    instagramHandle: (row.instagram_handle as string | null) ?? null,
    themeAccent: (row.theme_accent as string | null) ?? null,
    shippingNote: (row.shipping_note as string | null) ?? null,
    exchangePolicy: (row.exchange_policy as string | null) ?? null,
    physicalAddress: (row.physical_address as string | null) ?? null,
    vergiNo: (row.vergi_no as string | null) ?? null,
    iban: (row.iban as string | null) ?? null,
    commissionBps: (row.commission_bps as number) ?? 1000,
    ownerUserId: (row.owner_user_id as string | null) ?? null,
    contactName: (row.contact_name as string | null) ?? null,
    contactPhone: (row.contact_phone as string | null) ?? null,
    shippingAddress: (row.shipping_address as string | null) ?? null,
    returnAddress: (row.return_address as string | null) ?? null,
    status: row.status as TrBoutique["status"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function toPublicBoutique(boutique: TrBoutique): TrBoutiquePublic {
  return {
    id: boutique.id,
    slug: boutique.slug,
    name: boutique.name,
    legalName: boutique.legalName,
    description: boutique.description,
    logoUrl: boutique.logoUrl,
    whatsappPhone: boutique.whatsappPhone,
    instagramHandle: boutique.instagramHandle,
    themeAccent: boutique.themeAccent,
    shippingNote: boutique.shippingNote,
    exchangePolicy: boutique.exchangePolicy,
    physicalAddress: boutique.physicalAddress,
    status: boutique.status,
    createdAt: boutique.createdAt,
    updatedAt: boutique.updatedAt,
  };
}

export function mapProductRow(row: Record<string, unknown>): TrProduct {
  return {
    id: row.id as string,
    boutiqueId: row.boutique_id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    priceKurus: row.price_kurus as number,
    size: (row.size as string | null) ?? null,
    sizes: readStringArray(row.sizes),
    colors: readProductColors(row.colors),
    conditionLabel: (row.condition_label as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    images: readStringArray(row.images),
    status: row.status as TrProduct["status"],
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapOrderRow(row: Record<string, unknown>): TrOrder {
  return {
    id: row.id as string,
    customerEmail: row.customer_email as string,
    customerName: row.customer_name as string,
    customerPhone: (row.customer_phone as string | null) ?? null,
    shippingAddress: readShippingAddress(row.shipping_address),
    totalKurus: row.total_kurus as number,
    paymentStatus: row.payment_status as TrOrder["paymentStatus"],
    isSandbox: Boolean(row.is_sandbox),
    iyzicoPaymentId: (row.iyzico_payment_id as string | null) ?? null,
    iyzicoConversationId: (row.iyzico_conversation_id as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapOrderItemRow(row: Record<string, unknown>): TrOrderItem {
  return {
    id: row.id as string,
    orderId: row.order_id as string,
    productId: row.product_id as string,
    boutiqueId: row.boutique_id as string,
    title: row.title as string,
    priceKurus: row.price_kurus as number,
    quantity: (row.quantity as number) ?? 1,
    createdAt: row.created_at as string,
  };
}

export function shippingAddressToJson(address: TrShippingAddress): TrShippingAddress {
  return {
    line1: address.line1.trim(),
    line2: address.line2?.trim() || undefined,
    district: address.district.trim(),
    city: address.city.trim(),
    postalCode: address.postalCode.trim(),
    country: address.country.trim() || "TR",
  };
}
