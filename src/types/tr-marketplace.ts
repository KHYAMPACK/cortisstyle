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

/** Public-safe boutique fields (no vergi_no / iban / commission). */
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
  /** Editorial homepage JSON; null → code defaults for that boutique. */
  editorialContent: Record<string, unknown> | null;
  status: TrBoutiqueStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TrProductColor {
  name: string;
  hex: string;
}

/** Full boutique record — service role / admin only. */
export interface TrBoutique extends TrBoutiquePublic {
  vergiNo: string | null;
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
  /** AI on-model / lifestyle shots (content packs + PDP). */
  lifestyleImages: string[];
  /** Premade catalog backdrop id (one per product). */
  catalogBackgroundId: string | null;
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

export interface TrOrder {
  id: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  shippingAddress: TrShippingAddress;
  totalKurus: number;
  paymentStatus: TrPaymentStatus;
  fulfillmentStatus: TrFulfillmentStatus;
  isSandbox: boolean;
  iyzicoPaymentId: string | null;
  iyzicoConversationId: string | null;
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
  lifestyleImages?: string[];
  catalogBackgroundId?: string | null;
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
  lifestyleImages?: string[];
  catalogBackgroundId?: string | null;
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
  isSandbox?: boolean;
  /** Optional override for demo seeding historical orders. */
  createdAt?: string;
  items: Array<{
    productId: string;
    boutiqueId: string;
    title: string;
    priceKurus: number;
    quantity?: number;
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
