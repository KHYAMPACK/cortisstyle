import type { TrFashionProductFeatures } from "@/lib/tr/fashion/types";
import type { TrCustomArtProductFeatures } from "@/lib/tr/customArt/types";

export type TrBoutiqueStatus = "draft" | "pending" | "verified" | "suspended";
export type TrProductStatus = "available" | "sold" | "hidden";
export type TrPaymentStatus = "sandbox" | "pending" | "paid" | "failed" | "refunded";
/** Ikas-like owner fulfillment pipeline (separate from payment). */
export type TrFulfillmentStatus =
  | "created"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled";

/** Buyer invoice party at checkout (seller = boutique). */
export type TrInvoiceType = "individual" | "corporate";
/** Offline registry until GİB; no fake auto-issue. */
export type TrInvoiceStatus = "draft" | "issued_offline" | "void";

/** Per-boutique carrier adapter. Null on the order = shipped outside the app. */
export type TrShippingProviderId = "basitkargo";

export type TrShippingTrace = {
  status: string;
  time: string;
  location: string | null;
};

export type TrOrderShipment = {
  provider: TrShippingProviderId | null;
  externalId: string | null;
  barcode: string | null;
  carrierCode: string | null;
  carrierName: string | null;
  trackingCode: string | null;
  status: string | null;
  traces: TrShippingTrace[];
  feeKurus: number | null;
  /** Why auto-buy stopped. Only address_rejected unlocks address edit. */
  block: "address_rejected" | "insufficient_balance" | "provider_error" | null;
  addressRetryUsed: boolean;
  lastError: string | null;
};

/** Common garment categories for outfit builder filtering (free text in DB). */
export type TrGarmentCategory =
  | "top"
  | "bottom"
  | "dress"
  | "outerwear"
  | "shoes"
  | "bag"
  | "accessory"
  | "other";

export type TrCatalogProfileId = "fashion" | "custom_art";

/** Public-safe boutique fields (no iban / commission). Vergi no is on künye by design. */
export interface TrBoutiquePublic {
  id: string;
  slug: string;
  name: string;
  legalName: string | null;
  description: string | null;
  logoUrl: string | null;
  whatsappPhone: string | null;
  instagramHandle: string | null;
  themeAccent: string | null;
  shippingNote: string | null;
  exchangePolicy: string | null;
  physicalAddress: string | null;
  /** Storefront template — from DB; demo slugs may override. */
  homeLayout: "default" | "editorial" | null;
  /** Custom host e.g. pervinsoysal.com */
  customDomain: string | null;
  /** Tax id for künye / legal pages (not IBAN). */
  vergiNo: string | null;
  /** Editorial homepage JSON; null → code defaults for that boutique. */
  editorialContent: Record<string, unknown> | null;
  /** Vertical: fashion catalog vs print-on-demand custom art. */
  catalogProfile: TrCatalogProfileId;
  /** Public storefront contact email override. Null → info@{customDomain} or platform mailbox. */
  contactEmail: string | null;
  status: TrBoutiqueStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TrProductColor {
  name: string;
  hex: string;
}

/**
 * AI/owner-filled PDP specs. Empty keys are omitted.
 * Composed from per-vertical modules — see `src/lib/tr/fashion/types.ts` and
 * `src/lib/tr/customArt/types.ts` for the actual field definitions.
 */
export type TrProductFeatures = TrFashionProductFeatures & TrCustomArtProductFeatures;

export type TrOrderItemCustomization = {
  styleOption?: string | null;
  referenceId?: string | null;
};

/** Full boutique record — service role / admin only. */
export interface TrBoutique extends TrBoutiquePublic {
  iban: string | null;
  commissionBps: number;
  ownerUserId: string | null;
  contactName: string | null;
  contactPhone: string | null;
  shippingAddress: string | null;
  returnAddress: string | null;
  /** Boutique-scoped reusable size chips for the product editor. */
  sizePresets: string[];
  /** Boutique-scoped reusable color chips for the product editor. */
  colorPresets: TrProductColor[];
}

export interface TrProduct {
  id: string;
  boutiqueId: string;
  title: string;
  description: string | null;
  priceKurus: number;
  /** Original price before discount — demo/editorial use; live rows leave null. */
  compareAtPriceKurus: number | null;
  size: string | null;
  sizes: string[];
  colors: TrProductColor[];
  conditionLabel: string | null;
  category: string | null;
  /** Boutique gallery — original owner uploads. */
  images: string[];
  /** Marketplace / catalog cutouts (BG removed + normalized). */
  marketplaceImages: string[];
  /** Leftover flattened WebP copies. Boutique display uses marketplace PNGs, not these. */
  storefrontImages: string[];
  /** AI on-model / lifestyle shots (content packs + PDP). */
  lifestyleImages: string[];
  /** Premade catalog backdrop id (one per product). */
  catalogBackgroundId: string | null;
  /** PDP “Ürün özellikleri” — filled by catalog AI, editable in panel. */
  features: TrProductFeatures;
  status: TrProductStatus;
  stock: number;
  /** Per-size units. Empty when product has no sizes (then `stock` is the single count). */
  sizeStocks: Record<string, number>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrProductWithBoutique extends TrProduct {
  boutique: TrBoutiquePublic;
}

/** Boutique storefront — product catalog only (not outfit bundles). */
export interface TrBoutiqueStorefront extends TrBoutiquePublic {
  products: TrProduct[];
}

export interface TrShippingAddress {
  line1: string;
  line2?: string;
  district: string;
  city: string;
  postalCode: string;
  country: string;
}

/** Saved shopper address book entry (platform account, all boutiques). */
export interface TrCustomerAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  district: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TrCustomerAddressInput = {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  district: string;
  city: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
};

export type TrCustomerAddressPatch = Partial<TrCustomerAddressInput>;

export interface TrOrder {
  id: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  shippingAddress: TrShippingAddress;
  totalKurus: number;
  /** Coupon code applied at checkout, if any. */
  discountCode: string | null;
  /** Amount subtracted from line subtotal (kuruş). */
  discountKurus: number;
  invoiceType: TrInvoiceType;
  buyerTaxId: string | null;
  buyerTaxOffice: string | null;
  buyerTitle: string | null;
  paymentStatus: TrPaymentStatus;
  fulfillmentStatus: TrFulfillmentStatus;
  isSandbox: boolean;
  iyzicoPaymentId: string | null;
  iyzicoConversationId: string | null;
  shipment: TrOrderShipment;
  createdAt: string;
  updatedAt: string;
}

export interface TrInvoiceLineSummary {
  title: string;
  quantity: number;
  priceKurus: number;
  size: string | null;
}

export interface TrInvoice {
  id: string;
  boutiqueId: string;
  orderId: string;
  status: TrInvoiceStatus;
  buyerName: string;
  buyerEmail: string;
  invoiceType: TrInvoiceType;
  buyerTaxId: string | null;
  buyerTaxOffice: string | null;
  buyerTitle: string | null;
  totalKurus: number;
  lineSummary: TrInvoiceLineSummary[];
  externalInvoiceNo: string | null;
  issuedAt: string | null;
  notes: string | null;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrDiscountCode {
  id: string;
  boutiqueId: string;
  code: string;
  percentOff: number | null;
  amountOffKurus: number | null;
  active: boolean;
  usageLimit: number | null;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrOwnerCustomer {
  email: string;
  name: string;
  phone: string | null;
  orderCount: number;
  spendKurus: number;
  lastOrderAt: string;
}

export interface TrOrderItem {
  id: string;
  orderId: string;
  /** Null when the catalog product was deleted after the order. */
  productId: string | null;
  boutiqueId: string;
  title: string;
  priceKurus: number;
  quantity: number;
  /** Selected beden at purchase; null when product has no sizes. */
  size: string | null;
  /** Customer source photo for custom_art orders. */
  referenceImageUrl: string | null;
  customization: TrOrderItemCustomization | null;
  createdAt: string;
  /** Cover for packing UI — resolved from live product when available. */
  imageUrl: string | null;
}

export interface TrOrderWithItems extends TrOrder {
  items: TrOrderItem[];
}

export interface CreateTrBoutiqueInput {
  slug: string;
  name: string;
  legalName?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  whatsappPhone?: string | null;
  instagramHandle?: string | null;
  themeAccent?: string | null;
  shippingNote?: string | null;
  exchangePolicy?: string | null;
  physicalAddress?: string | null;
  homeLayout?: "default" | "editorial" | null;
  customDomain?: string | null;
  editorialContent?: Record<string, unknown> | null;
  catalogProfile?: TrCatalogProfileId;
  vergiNo?: string | null;
  iban?: string | null;
  commissionBps?: number;
  contactName?: string | null;
  contactPhone?: string | null;
  shippingAddress?: string | null;
  returnAddress?: string | null;
  status?: TrBoutiqueStatus;
}

export interface CreateTrProductInput {
  boutiqueId: string;
  title: string;
  description?: string | null;
  priceKurus: number;
  compareAtPriceKurus?: number | null;
  size?: string | null;
  sizes?: string[];
  colors?: TrProductColor[];
  conditionLabel?: string | null;
  category?: string | null;
  images?: string[];
  marketplaceImages?: string[];
  storefrontImages?: string[];
  lifestyleImages?: string[];
  catalogBackgroundId?: string | null;
  features?: TrProductFeatures;
  status?: TrProductStatus;
  stock?: number;
  sizeStocks?: Record<string, number>;
  sortOrder?: number;
}

export interface UpdateTrProductInput {
  title?: string;
  description?: string | null;
  priceKurus?: number;
  compareAtPriceKurus?: number | null;
  size?: string | null;
  sizes?: string[];
  colors?: TrProductColor[];
  conditionLabel?: string | null;
  category?: string | null;
  images?: string[];
  marketplaceImages?: string[];
  storefrontImages?: string[];
  lifestyleImages?: string[];
  catalogBackgroundId?: string | null;
  features?: TrProductFeatures;
  status?: TrProductStatus;
  stock?: number;
  sizeStocks?: Record<string, number>;
  sortOrder?: number;
}

export interface CreateTrOrderInput {
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  shippingAddress: TrShippingAddress;
  invoiceType?: TrInvoiceType;
  buyerTaxId?: string | null;
  buyerTaxOffice?: string | null;
  buyerTitle?: string | null;
  isSandbox?: boolean;
  /** Optional override for demo seeding historical orders. */
  createdAt?: string;
  discountCode?: string | null;
  discountKurus?: number;
  /** When true (default for live checkout), decrement stock after insert. */
  decrementInventory?: boolean;
  /** Customer-paid shipping (kuruş). Server-quoted; never trust the client. */
  shippingFeeKurus?: number;
  shippingProvider?: TrOrder["shipment"]["provider"];
  /** Default true. Card-capture holds skip push until iyzico SUCCESS. */
  notifyOwners?: boolean;
  items: Array<{
    productId: string;
    boutiqueId: string;
    title: string;
    priceKurus: number;
    quantity?: number;
    size?: string | null;
    referenceImageUrl?: string | null;
    customization?: TrOrderItemCustomization | null;
  }>;
}

export function formatTryFromKurus(kurus: number): string {
  const lira = kurus / 100;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(lira);
}

export function parseTryToKurus(amount: string | number): number {
  if (typeof amount === "number") {
    return Math.round(amount * 100);
  }

  const normalized = amount.replace(/[^\d,.-]/g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Invalid TRY amount.");
  }

  return Math.round(value * 100);
}
