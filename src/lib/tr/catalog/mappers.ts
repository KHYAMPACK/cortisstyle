import type {
  TrBoutique,
  TrBoutiquePublic,
  TrDiscountCode,
  TrInvoiceType,
  TrOrder,
  TrOrderItem,
  TrProduct,
  TrProductColor,
  TrShippingAddress,
  TrShippingProviderId,
} from "@/types/tr-marketplace";
import { readSizeStocks } from "@/lib/tr/sizeStocks";
import {
  EMPTY_ORDER_SHIPMENT,
  type TrOrderShipment,
  type TrShippingTrace,
} from "@/lib/tr/shipping/types";

function readInvoiceType(value: unknown): TrInvoiceType {
  return value === "corporate" ? "corporate" : "individual";
}

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
    homeLayout:
      row.home_layout === "editorial" || row.home_layout === "default"
        ? row.home_layout
        : null,
    customDomain: (row.custom_domain as string | null) ?? null,
    editorialContent:
      row.editorial_content &&
      typeof row.editorial_content === "object" &&
      !Array.isArray(row.editorial_content)
        ? (row.editorial_content as Record<string, unknown>)
        : null,
    vergiNo: (row.vergi_no as string | null) ?? null,
    iban: (row.iban as string | null) ?? null,
    commissionBps: (row.commission_bps as number) ?? 1000,
    ownerUserId: (row.owner_user_id as string | null) ?? null,
    contactName: (row.contact_name as string | null) ?? null,
    contactPhone: (row.contact_phone as string | null) ?? null,
    shippingAddress: (row.shipping_address as string | null) ?? null,
    returnAddress: (row.return_address as string | null) ?? null,
    sizePresets: readStringArray(row.size_presets),
    colorPresets: readProductColors(row.color_presets),
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
    homeLayout: boutique.homeLayout,
    customDomain: boutique.customDomain,
    vergiNo: boutique.vergiNo,
    editorialContent: boutique.editorialContent,
    status: boutique.status,
    createdAt: boutique.createdAt,
    updatedAt: boutique.updatedAt,
  };
}

export function mapProductRow(row: Record<string, unknown>): TrProduct {
  const compareAt =
    typeof row.compare_at_price_kurus === "number"
      ? (row.compare_at_price_kurus as number)
      : null;
  return {
    id: row.id as string,
    boutiqueId: row.boutique_id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    priceKurus: row.price_kurus as number,
    compareAtPriceKurus: compareAt,
    size: (row.size as string | null) ?? null,
    sizes: readStringArray(row.sizes),
    colors: readProductColors(row.colors),
    conditionLabel: (row.condition_label as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    images: readStringArray(row.images),
    marketplaceImages: readStringArray(row.marketplace_images),
    lifestyleImages: readStringArray(row.lifestyle_images),
    catalogBackgroundId:
      typeof row.catalog_background_id === "string"
        ? row.catalog_background_id
        : null,
    status: row.status as TrProduct["status"],
    stock: typeof row.stock === "number" ? row.stock : 1,
    sizeStocks: readSizeStocks(row.size_stocks),
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function readShippingProvider(value: unknown): TrShippingProviderId | null {
  return value === "basitkargo" ? "basitkargo" : null;
}

function readShippingTraces(value: unknown): TrShippingTrace[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as Record<string, unknown>;
      const status = typeof row.status === "string" ? row.status.trim() : "";
      if (!status) return null;
      return {
        status,
        time: typeof row.time === "string" ? row.time : "",
        location: typeof row.location === "string" ? row.location : null,
      } satisfies TrShippingTrace;
    })
    .filter((row): row is TrShippingTrace => row !== null);
}

function readOrderShipment(row: Record<string, unknown>): TrOrderShipment {
  const provider = readShippingProvider(row.shipping_provider);
  const externalId =
    typeof row.shipping_external_id === "string"
      ? row.shipping_external_id
      : null;
  const feeKurus =
    typeof row.shipping_fee_kurus === "number" ? row.shipping_fee_kurus : null;
  if (!provider && !externalId && feeKurus == null) {
    return { ...EMPTY_ORDER_SHIPMENT };
  }
  return {
    provider,
    externalId,
    barcode:
      typeof row.shipping_barcode === "string" ? row.shipping_barcode : null,
    carrierCode:
      typeof row.shipping_carrier_code === "string"
        ? row.shipping_carrier_code
        : null,
    carrierName:
      typeof row.shipping_carrier_name === "string"
        ? row.shipping_carrier_name
        : null,
    trackingCode:
      typeof row.shipping_tracking_code === "string"
        ? row.shipping_tracking_code
        : null,
    status:
      typeof row.shipping_status === "string" ? row.shipping_status : null,
    traces: readShippingTraces(row.shipping_traces),
    feeKurus,
    block:
      row.shipping_block === "address_rejected" ? "address_rejected" : null,
    addressRetryUsed: Boolean(row.shipping_address_retry_used),
    lastError:
      typeof row.shipping_last_error === "string"
        ? row.shipping_last_error
        : null,
  };
}

function readFulfillmentStatus(
  value: unknown,
): TrOrder["fulfillmentStatus"] {
  if (
    value === "created" ||
    value === "ready" ||
    value === "shipped" ||
    value === "delivered" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "created";
}

export function mapOrderRow(row: Record<string, unknown>): TrOrder {
  return {
    id: row.id as string,
    customerEmail: row.customer_email as string,
    customerName: row.customer_name as string,
    customerPhone: (row.customer_phone as string | null) ?? null,
    shippingAddress: readShippingAddress(row.shipping_address),
    totalKurus: row.total_kurus as number,
    discountCode:
      typeof row.discount_code === "string" && row.discount_code.trim()
        ? (row.discount_code as string)
        : null,
    discountKurus:
      typeof row.discount_kurus === "number" ? (row.discount_kurus as number) : 0,
    invoiceType: readInvoiceType(row.invoice_type),
    buyerTaxId: (row.buyer_tax_id as string | null) ?? null,
    buyerTaxOffice: (row.buyer_tax_office as string | null) ?? null,
    buyerTitle: (row.buyer_title as string | null) ?? null,
    paymentStatus: row.payment_status as TrOrder["paymentStatus"],
    fulfillmentStatus: readFulfillmentStatus(row.fulfillment_status),
    isSandbox: Boolean(row.is_sandbox),
    iyzicoPaymentId: (row.iyzico_payment_id as string | null) ?? null,
    iyzicoConversationId: (row.iyzico_conversation_id as string | null) ?? null,
    shipment: readOrderShipment(row),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapDiscountCodeRow(row: Record<string, unknown>): TrDiscountCode {
  return {
    id: row.id as string,
    boutiqueId: row.boutique_id as string,
    code: row.code as string,
    percentOff:
      typeof row.percent_off === "number" ? (row.percent_off as number) : null,
    amountOffKurus:
      typeof row.amount_off_kurus === "number"
        ? (row.amount_off_kurus as number)
        : null,
    active: Boolean(row.active),
    usageLimit:
      typeof row.usage_limit === "number" ? (row.usage_limit as number) : null,
    usedCount: typeof row.used_count === "number" ? (row.used_count as number) : 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapOrderItemRow(row: Record<string, unknown>): TrOrderItem {
  const productIdRaw = row.product_id;
  const sizeRaw = row.size;
  return {
    id: row.id as string,
    orderId: row.order_id as string,
    productId:
      typeof productIdRaw === "string" && productIdRaw.trim()
        ? productIdRaw
        : null,
    boutiqueId: row.boutique_id as string,
    title: row.title as string,
    priceKurus: row.price_kurus as number,
    quantity: (row.quantity as number) ?? 1,
    size:
      typeof sizeRaw === "string" && sizeRaw.trim() ? sizeRaw.trim() : null,
    createdAt: row.created_at as string,
    imageUrl: null,
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
