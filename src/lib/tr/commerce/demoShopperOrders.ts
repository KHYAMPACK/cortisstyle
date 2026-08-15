import { getProductCoverImageFor } from "@/lib/tr/productImages";
import type { TrProduct, TrShippingAddress } from "@/types/tr-marketplace";

/** Stable ids so demo URLs stay bookmarkable until live orders replace this. */
export const DEMO_SHOPPER_SHIPPED_ORDER_ID = "demo-shipped";
export const DEMO_SHOPPER_PROCESSING_ORDER_ID = "demo-processing";

export type DemoShopperOrderStatus =
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type DemoShopperOrderItem = {
  id: string;
  title: string;
  image: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPriceKurus: number;
  status: DemoShopperOrderStatus;
};

export type DemoShopperTrackingEvent = {
  at: string;
  location: string;
  message: string;
};

export type DemoShopperTracking = {
  carrier: string;
  trackingNumber: string;
  /** 0 = kargoya verildi … 3 = teslim */
  currentStep: number;
  events: DemoShopperTrackingEvent[];
};

export type DemoShopperOrder = {
  id: string;
  displayNumber: string;
  orderedAt: string;
  expectedArrivalAt: string | null;
  status: DemoShopperOrderStatus;
  shippingMethod: string;
  customerName: string;
  phone: string;
  shippingAddress: TrShippingAddress;
  items: DemoShopperOrderItem[];
  subtotalKurus: number;
  shippingKurus: number;
  totalKurus: number;
  tracking: DemoShopperTracking | null;
};

const TRACKING_STEPS = [
  "Kargoya verildi",
  "Yolda",
  "Dağıtımda",
  "Teslim edildi",
] as const;

const STATUS_LABEL: Record<DemoShopperOrderStatus, string> = {
  processing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
};

export const DEMO_SHOPPER_LOOKUP_POSTAL_CODE = "34710";

export const DEMO_CANCEL_REASONS = [
  "Fikrim değişti",
  "Yanlış beden veya renk",
  "Teslimat süresi uzun geldi",
  "Başka bir ürüne geçeceğim",
  "Diğer",
] as const;

const FALLBACK_ITEM: Omit<DemoShopperOrderItem, "status" | "id"> = {
  title: "Keten gömlek",
  image: null,
  size: "M",
  color: "Krem",
  quantity: 1,
  unitPriceKurus: 189900,
};

function shiftDays(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function shiftHours(hours: number): string {
  const date = new Date();
  date.setTime(date.getTime() + hours * 60 * 60 * 1000);
  return date.toISOString();
}

function itemFromProduct(
  product: Pick<
    TrProduct,
    "title" | "priceKurus" | "images" | "marketplaceImages" | "sizes" | "colors"
  > | undefined,
  status: DemoShopperOrderStatus,
  id: string,
): DemoShopperOrderItem {
  if (!product) {
    return { ...FALLBACK_ITEM, id, status };
  }
  return {
    id,
    title: product.title,
    image: getProductCoverImageFor("boutique", product),
    size: product.sizes[0] ?? FALLBACK_ITEM.size,
    color: product.colors[0]?.name ?? FALLBACK_ITEM.color,
    quantity: 1,
    unitPriceKurus: product.priceKurus || FALLBACK_ITEM.unitPriceKurus,
    status,
  };
}

const DEMO_ADDRESS: TrShippingAddress = {
  line1: "Moda Cad. No:12 Daire 3",
  district: "Kadıköy",
  city: "İstanbul",
  postalCode: "34710",
  country: "TR",
};

/**
 * Boutique-scoped demo orders for shopper Hesabım / detail / tracking.
 * Swap this for a live order fetch when accounts are tied to `tr_orders`.
 */
export function listDemoShopperOrders(
  products: Pick<
    TrProduct,
    "title" | "priceKurus" | "images" | "marketplaceImages" | "sizes" | "colors"
  >[],
): DemoShopperOrder[] {
  const first = products[0];
  const second = products[1] ?? products[0];

  const shippedItem = itemFromProduct(
    first,
    "shipped",
    `${DEMO_SHOPPER_SHIPPED_ORDER_ID}-0`,
  );
  const processingItem = itemFromProduct(
    second,
    "processing",
    `${DEMO_SHOPPER_PROCESSING_ORDER_ID}-0`,
  );
  const extraShipped = products[1]
    ? itemFromProduct(second, "shipped", `${DEMO_SHOPPER_SHIPPED_ORDER_ID}-1`)
    : null;
  const extraProcessing = products[1]
    ? itemFromProduct(first, "processing", `${DEMO_SHOPPER_PROCESSING_ORDER_ID}-1`)
    : null;

  const shippedItems = extraShipped ? [shippedItem, extraShipped] : [shippedItem];
  const processingItems = extraProcessing
    ? [processingItem, extraProcessing]
    : [processingItem];
  const shippedSubtotal = shippedItems.reduce(
    (sum, item) => sum + item.unitPriceKurus * item.quantity,
    0,
  );
  const shippingKurus = 14900;
  const processingSubtotal = processingItems.reduce(
    (sum, item) => sum + item.unitPriceKurus * item.quantity,
    0,
  );

  const shipped: DemoShopperOrder = {
    id: DEMO_SHOPPER_SHIPPED_ORDER_ID,
    displayNumber: "CS-DEM-2401",
    orderedAt: shiftDays(-4),
    expectedArrivalAt: shiftDays(1),
    status: "shipped",
    shippingMethod: "Standart kargo",
    customerName: "Ayşe Yılmaz",
    phone: "05320000000",
    shippingAddress: DEMO_ADDRESS,
    items: shippedItems,
    subtotalKurus: shippedSubtotal,
    shippingKurus,
    totalKurus: shippedSubtotal + shippingKurus,
    tracking: {
      carrier: "Yurtiçi Kargo",
      trackingNumber: "YK847291650TR",
      currentStep: 1,
      events: [
        {
          at: shiftHours(-6),
          location: "İstanbul · Kadıköy",
          message: "Transfer merkezinden çıktı, dağıtım deposuna doğru yolda.",
        },
        {
          at: shiftHours(-22),
          location: "Kocaeli · Gebze",
          message: "Aktarma merkezinde işlem gördü.",
        },
        {
          at: shiftHours(-54),
          location: "Denizli",
          message: "Kargoya verildi.",
        },
      ],
    },
  };

  const processing: DemoShopperOrder = {
    id: DEMO_SHOPPER_PROCESSING_ORDER_ID,
    displayNumber: "CS-DEM-2398",
    orderedAt: shiftDays(-1),
    expectedArrivalAt: shiftDays(5),
    status: "processing",
    shippingMethod: "Standart kargo",
    customerName: "Ayşe Yılmaz",
    phone: "05320000000",
    shippingAddress: DEMO_ADDRESS,
    items: processingItems,
    subtotalKurus: processingSubtotal,
    shippingKurus,
    totalKurus: processingSubtotal + shippingKurus,
    tracking: null,
  };

  return [shipped, processing];
}

export function getDemoShopperOrder(
  orderId: string,
  products: Parameters<typeof listDemoShopperOrders>[0],
): DemoShopperOrder | null {
  return (
    listDemoShopperOrders(products).find((order) => order.id === orderId) ??
    null
  );
}

function normalizeOrderLookup(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function findDemoShopperOrder(
  orders: DemoShopperOrder[],
  input: { orderNumber: string; postalCode: string },
): DemoShopperOrder | null {
  const number = normalizeOrderLookup(input.orderNumber);
  const postal = input.postalCode.replace(/\D/g, "");
  if (!number || !postal) return null;

  return (
    orders.find((order) => {
      const matchesNumber =
        normalizeOrderLookup(order.displayNumber) === number ||
        normalizeOrderLookup(order.id) === number;
      const matchesPostal =
        order.shippingAddress.postalCode.replace(/\D/g, "") === postal;
      return matchesNumber && matchesPostal;
    }) ?? null
  );
}

export function canCancelDemoShopperOrder(order: DemoShopperOrder): boolean {
  return (
    order.status === "processing" &&
    order.items.some((item) => item.status !== "cancelled")
  );
}

export type DemoShopperOrderOverrides = {
  cancelledItemIdsByOrder: Record<string, string[]>;
};

const OVERRIDE_KEY_PREFIX = "tr-demo-order-overrides:";

export function emptyDemoOrderOverrides(): DemoShopperOrderOverrides {
  return { cancelledItemIdsByOrder: {} };
}

export function readDemoOrderOverrides(
  boutiqueSlug: string,
): DemoShopperOrderOverrides {
  if (typeof window === "undefined") return emptyDemoOrderOverrides();
  try {
    const raw = window.sessionStorage.getItem(
      `${OVERRIDE_KEY_PREFIX}${boutiqueSlug}`,
    );
    if (!raw) return emptyDemoOrderOverrides();
    const parsed = JSON.parse(raw) as DemoShopperOrderOverrides;
    if (!parsed?.cancelledItemIdsByOrder) return emptyDemoOrderOverrides();
    return parsed;
  } catch {
    return emptyDemoOrderOverrides();
  }
}

export function writeDemoOrderOverrides(
  boutiqueSlug: string,
  overrides: DemoShopperOrderOverrides,
): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    `${OVERRIDE_KEY_PREFIX}${boutiqueSlug}`,
    JSON.stringify(overrides),
  );
}

export function applyDemoOrderOverrides(
  orders: DemoShopperOrder[],
  overrides: DemoShopperOrderOverrides,
): DemoShopperOrder[] {
  return orders.map((order) => {
    const cancelled = new Set(
      overrides.cancelledItemIdsByOrder[order.id] ?? [],
    );
    if (cancelled.size === 0) return order;
    const items = order.items.map((item) =>
      cancelled.has(item.id) ? { ...item, status: "cancelled" as const } : item,
    );
    const allCancelled = items.every((item) => item.status === "cancelled");
    if (!allCancelled) {
      return { ...order, items };
    }
    return {
      ...order,
      items,
      status: "cancelled",
      tracking: null,
      expectedArrivalAt: null,
    };
  });
}

export function demoShopperOrderStatusLabel(
  status: DemoShopperOrderStatus,
): string {
  return STATUS_LABEL[status];
}

export function demoShopperTrackingSteps(): readonly string[] {
  return TRACKING_STEPS;
}

export function formatDemoShopperDate(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDemoShopperDateTime(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDemoShopperPhone(digits: string): string {
  const clean = digits.replace(/\D/g, "");
  if (clean.length === 11 && clean.startsWith("0")) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7, 9)} ${clean.slice(9)}`;
  }
  return digits;
}
