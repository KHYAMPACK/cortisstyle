export type TrBoutiqueStatus = "draft" | "pending" | "verified" | "suspended";
export type TrProductStatus = "available" | "sold" | "hidden";
export type TrPaymentStatus = "sandbox" | "pending" | "paid" | "failed" | "refunded";

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
  status: TrBoutiqueStatus;
  createdAt: string;
  updatedAt: string;
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
}

export interface TrProductColor {
  name: string;
  hex: string;
}

export interface TrProduct {
  id: string;
  boutiqueId: string;
  title: string;
  description: string | null;
  priceKurus: number;
  size: string | null;
  sizes: string[];
  colors: TrProductColor[];
  conditionLabel: string | null;
  category: string | null;
  images: string[];
  status: TrProductStatus;
  stock: number;
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
  isSandbox: boolean;
  iyzicoPaymentId: string | null;
  iyzicoConversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrOrderItem {
  id: string;
  orderId: string;
  productId: string;
  boutiqueId: string;
  title: string;
  priceKurus: number;
  quantity: number;
  createdAt: string;
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
  size?: string | null;
  sizes?: string[];
  colors?: TrProductColor[];
  conditionLabel?: string | null;
  category?: string | null;
  images?: string[];
  status?: TrProductStatus;
  stock?: number;
  sortOrder?: number;
}

export interface UpdateTrProductInput {
  title?: string;
  description?: string | null;
  priceKurus?: number;
  size?: string | null;
  sizes?: string[];
  colors?: TrProductColor[];
  conditionLabel?: string | null;
  category?: string | null;
  images?: string[];
  status?: TrProductStatus;
  stock?: number;
  sortOrder?: number;
}

export interface CreateTrOrderInput {
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  shippingAddress: TrShippingAddress;
  isSandbox?: boolean;
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
