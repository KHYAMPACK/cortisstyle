import { getSupabaseClient } from "@/lib/supabaseClient";
import { prepareOwnerUploadFile } from "@/lib/tr/prepareOwnerUploadFile";
import { sanitizeProductFeatures } from "@/lib/tr/catalog/productFeatures";
import { parseAiCategoryId } from "@/lib/tr/catalog/categories";
import type { TrOwnerProductOriginals } from "@/lib/tr/catalog/products";
import {
  cachedOwnerFetch,
  invalidateOwnerCache,
  ownerCacheKeys,
  peekOwnerCache,
} from "@/lib/tr/panel/ownerCache";
import type { TrShippingRate } from "@/lib/tr/shipping/types";
import type {
  TrInvoice,
  TrInvoiceStatus,
  TrOrderWithItems,
  TrProduct,
  TrProductColor,
  TrProductFeatures,
  TrProductStatus,
} from "@/types/tr-marketplace";

export interface TrOwnerBoutiqueSummary {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  themeAccent?: string | null;
  status?: string;
}

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await getSupabaseClient().auth.getSession();
  return session?.access_token ?? null;
}

async function ownerFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Oturum gerekli.");
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(path, { ...init, headers });
}

async function parseOwnerJson(response: Response): Promise<unknown> {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed || (trimmed[0] !== "{" && trimmed[0] !== "[")) {
    throw new Error(
      response.status === 404
        ? "Panel API bulunamadı. Sayfayı yenileyin; devam ederse dev sunucusunu yeniden başlatın."
        : `Beklenmeyen sunucu yanıtı (${response.status}).`,
    );
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`Beklenmeyen sunucu yanıtı (${response.status}).`);
  }
}

function invalidateProductLists(): void {
  invalidateOwnerCache("products:");
  invalidateOwnerCache("product-originals:");
  invalidateOwnerCache("summary:");
}

function invalidateOrderLists(): void {
  invalidateOwnerCache("orders:");
  invalidateOwnerCache("summary:");
}

export async function fetchOwnerBoutiques(): Promise<{
  boutiques: TrOwnerBoutiqueSummary[];
  isStaff: boolean;
}> {
  return cachedOwnerFetch(ownerCacheKeys.boutiques, async () => {
    const response = await ownerFetch("/api/tr/owner/boutiques");
    const data = (await parseOwnerJson(response)) as {
      boutiques?: TrOwnerBoutiqueSummary[];
      isStaff?: boolean;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? "Butikler yüklenemedi.");
    }
    return {
      boutiques: data.boutiques ?? [],
      isStaff: Boolean(data.isStaff),
    };
  });
}

export function peekOwnerProducts(boutiqueId: string):
  | { boutique: TrOwnerBoutiqueSummary; products: TrProduct[] }
  | undefined {
  return peekOwnerCache(ownerCacheKeys.products(boutiqueId));
}

export function peekOwnerOrders(
  boutiqueId: string,
): TrOrderWithItems[] | undefined {
  return peekOwnerCache(ownerCacheKeys.orders(boutiqueId));
}

export function peekOwnerSummary(
  boutiqueId: string,
  range: "today" | "7d" | "30d" | "all" = "today",
): TrOwnerSummaryResponse | undefined {
  return peekOwnerCache(ownerCacheKeys.summary(boutiqueId, range));
}

export function peekOwnerCustomers(
  boutiqueId: string,
): import("@/types/tr-marketplace").TrOwnerCustomer[] | undefined {
  return peekOwnerCache(ownerCacheKeys.customers(boutiqueId));
}

export function prefetchOwnerProducts(boutiqueId: string): void {
  void fetchOwnerProducts(boutiqueId);
}

export function prefetchOwnerOrders(boutiqueId: string): void {
  void fetchOwnerOrders(boutiqueId);
}

export async function fetchOwnerProducts(boutiqueId: string): Promise<{
  boutique: TrOwnerBoutiqueSummary;
  products: TrProduct[];
}> {
  return cachedOwnerFetch(ownerCacheKeys.products(boutiqueId), async () => {
    const response = await ownerFetch(
      `/api/tr/owner/products?boutiqueId=${encodeURIComponent(boutiqueId)}`,
    );
    const data = (await parseOwnerJson(response)) as {
      boutique?: TrOwnerBoutiqueSummary;
      products?: TrProduct[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? "Ürünler yüklenemedi.");
    }
    if (!data.boutique) {
      throw new Error("Butik bulunamadı.");
    }
    return { boutique: data.boutique, products: data.products ?? [] };
  });
}

export type { TrOwnerProductOriginals };

export async function fetchOwnerProductOriginals(
  boutiqueId: string,
): Promise<TrOwnerProductOriginals[]> {
  return cachedOwnerFetch(
    ownerCacheKeys.productOriginals(boutiqueId),
    async () => {
      const response = await ownerFetch(
        `/api/tr/owner/products/originals?boutiqueId=${encodeURIComponent(boutiqueId)}`,
      );
      if (response.status === 404) {
        return [];
      }
      const data = (await parseOwnerJson(response)) as {
        products?: TrOwnerProductOriginals[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Orijinal fotoğraflar yüklenemedi.");
      }
      return data.products ?? [];
    },
  );
}

export async function fetchOwnerProduct(productId: string): Promise<{
  product: TrProduct;
  boutique: TrOwnerBoutiqueSummary;
}> {
  const response = await ownerFetch(
    `/api/tr/owner/products/${encodeURIComponent(productId)}`,
  );
  const data = (await parseOwnerJson(response)) as {
    product?: TrProduct;
    boutique?: TrOwnerBoutiqueSummary;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Ürün yüklenemedi.");
  }
  if (!data.product || !data.boutique) {
    throw new Error("Ürün bulunamadı.");
  }
  return { product: data.product, boutique: data.boutique };
}

export interface TrOwnerProductPayload {
  boutiqueId: string;
  title: string;
  description?: string | null;
  priceTry: number;
  compareAtPriceTry?: number | null;
  sizes: string[];
  colors: TrProductColor[];
  category: string | null;
  images: string[];
  marketplaceImages?: string[];
  lifestyleImages?: string[];
  catalogBackgroundId?: string | null;
  features?: TrProductFeatures;
  stock?: number;
  sizeStocks?: Record<string, number>;
  conditionLabel?: string | null;
  status?: TrProductStatus;
}

export async function createOwnerProduct(
  payload: TrOwnerProductPayload,
): Promise<TrProduct> {
  const response = await ownerFetch("/api/tr/owner/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = (await parseOwnerJson(response)) as { product?: TrProduct; error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Ürün oluşturulamadı.");
  }
  if (!data.product) throw new Error("Ürün oluşturulamadı.");
  invalidateProductLists();
  return data.product;
}

/** Partial product fields for PATCH — API merges; full create still uses TrOwnerProductPayload. */
export type TrOwnerProductPatch = Partial<
  Omit<TrOwnerProductPayload, "boutiqueId">
> & {
  boutiqueId?: string;
};

export async function updateOwnerProduct(
  productId: string,
  payload: TrOwnerProductPatch,
): Promise<TrProduct> {
  const response = await ownerFetch(
    `/api/tr/owner/products/${encodeURIComponent(productId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
  const data = (await parseOwnerJson(response)) as { product?: TrProduct; error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Ürün güncellenemedi.");
  }
  if (!data.product) throw new Error("Ürün güncellenemedi.");
  invalidateProductLists();
  return data.product;
}

export type TrMarketplaceUploadStatus = "ready" | "skipped" | "failed";

export interface OwnerProductImageUploadResult {
  url: string;
  marketplaceUrl: string | null;
  marketplaceStatus: TrMarketplaceUploadStatus;
  marketplaceError: string | null;
}

export async function uploadOwnerProductImage(
  boutiqueId: string,
  file: File,
  options?: { removeBackground?: boolean },
): Promise<OwnerProductImageUploadResult> {
  const prepared = await prepareOwnerUploadFile(file);
  const formData = new FormData();
  formData.set("boutiqueId", boutiqueId);
  formData.set("file", prepared);
  formData.set(
    "removeBackground",
    options?.removeBackground === false ? "false" : "true",
  );

  const response = await ownerFetch("/api/tr/owner/upload", {
    method: "POST",
    body: formData,
  });

  if (response.status === 413) {
    throw new Error(
      "Fotoğraf çok büyük. Daha küçük bir görsel deneyin (yaklaşık 10 MB altı).",
    );
  }

  let data: {
    url?: string;
    marketplaceUrl?: string | null;
    marketplaceStatus?: TrMarketplaceUploadStatus;
    marketplaceError?: string | null;
    error?: string;
  };
  try {
    data = (await parseOwnerJson(response)) as typeof data;
  } catch {
    throw new Error(
      response.ok
        ? "Fotoğraf yanıtı okunamadı."
        : "Fotoğraf yüklenemedi.",
    );
  }

  if (!response.ok) {
    throw new Error(data.error ?? "Fotoğraf yüklenemedi.");
  }
  if (!data.url) throw new Error("Fotoğraf yüklenemedi.");

  const marketplaceUrl = data.marketplaceUrl ?? null;
  const marketplaceStatus: TrMarketplaceUploadStatus =
    data.marketplaceStatus ??
    (marketplaceUrl ? "ready" : "failed");

  return {
    url: data.url,
    marketplaceUrl,
    marketplaceStatus,
    marketplaceError: data.marketplaceError ?? null,
  };
}

export interface OwnerListingDraft {
  title: string;
  description: string;
  features?: TrProductFeatures;
  category?: string | null;
  promptFront?: string | null;
}

function readOwnerListingDraft(raw: unknown): OwnerListingDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  if (!title) return null;
  const promptFront =
    typeof record.promptFront === "string" ? record.promptFront.trim() : "";
  return {
    title,
    description:
      typeof record.description === "string" ? record.description.trim() : "",
    features: sanitizeProductFeatures(record.features),
    category: parseAiCategoryId(record.category),
    promptFront: promptFront || null,
  };
}

export interface OwnerPackshotResult {
  status: string;
  imageUrls: string[];
  predictionId: string | null;
  creditsUsed: number | null;
  error: string | null;
  listingDraft?: OwnerListingDraft | null;
}

export async function requestOwnerPackshot(input: {
  boutiqueId: string;
  sourceImageUrl: string;
  productId?: string;
  title?: string;
  category?: string | null;
  view?: "front" | "back" | "extra" | "detail";
  promptExtra?: string;
  /** From prepare-packshot — avoids a second Gemini call. */
  prompt?: string;
  listingDraft?: OwnerListingDraft | null;
  numImages?: number;
  skipPhotoroom?: boolean;
  uploadType?: string | null;
}): Promise<OwnerPackshotResult> {
  const response = await ownerFetch("/api/tr/owner/ai-catalog/packshot", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const data = (await parseOwnerJson(response)) as {
    ok?: boolean;
    result?: OwnerPackshotResult;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Packshot üretilemedi.");
  }
  if (!data.result) {
    throw new Error("Packshot yanıtı eksik.");
  }
  return data.result;
}

export interface OwnerPackshotPrepareResult {
  prompt: string;
  listingDraft: OwnerListingDraft | null;
  usedGemini: boolean;
}

/** Gemini identify + packshot prompt only (no FASHN). */
export async function requestOwnerPackshotPrepare(input: {
  boutiqueId: string;
  sourceImageUrl: string;
  backImageUrl?: string;
  detailImageUrl?: string;
  title?: string;
  category?: string | null;
  view?: "front" | "back" | "extra" | "detail";
  promptExtra?: string;
  uploadType?: string | null;
  existingTitle?: string | null;
  existingDescription?: string | null;
  lockedConstruction?: {
    neckline?: string | null;
    sleeves?: string | null;
    length?: string | null;
    decollete?: string | null;
  } | null;
}): Promise<OwnerPackshotPrepareResult> {
  const response = await ownerFetch(
    "/api/tr/owner/ai-catalog/prepare-packshot",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  const data = (await parseOwnerJson(response)) as {
    ok?: boolean;
    prompt?: string;
    listingDraft?: OwnerListingDraft | null;
    usedGemini?: boolean;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Ürün analizi başarısız.");
  }
  if (!data.prompt?.trim()) {
    throw new Error("Packshot prompt eksik.");
  }
  return {
    prompt: data.prompt.trim(),
    listingDraft: readOwnerListingDraft(data.listingDraft),
    usedGemini: Boolean(data.usedGemini),
  };
}

export async function requestOwnerListingDraft(input: {
  boutiqueId: string;
  sourceImageUrl: string;
  backImageUrl?: string;
  detailImageUrl?: string;
  category?: string | null;
  uploadType?: string | null;
}): Promise<OwnerListingDraft> {
  const response = await ownerFetch("/api/tr/owner/ai-catalog/listing-draft", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const data = (await parseOwnerJson(response)) as {
    ok?: boolean;
    draft?: OwnerListingDraft;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Ürün metni oluşturulamadı.");
  }
  if (!data.draft?.title?.trim()) {
    throw new Error("Ürün metni yanıtı eksik.");
  }
  return (
    readOwnerListingDraft(data.draft) ?? {
      title: data.draft.title.trim(),
      description: data.draft.description?.trim() ?? "",
      features: {},
    }
  );
}

export interface OwnerAiModelGenerateResult {
  status: string;
  providerId?: string;
  imageUrl?: string;
  imageUrls?: string[];
  jobId?: string;
  creditsUsed?: number | null;
  error?: string;
  stub?: boolean;
}

export async function requestOwnerAiModelGenerate(input: {
  boutiqueId: string;
  cutoutImageUrl: string;
  originalImageUrl?: string;
  productId?: string;
  title?: string;
  category?: string | null;
  pose?:
    | "standing-front"
    | "standing-back"
    | "standing-three-quarter"
    | "full-body"
    | "waist-up";
  modelId?: string;
  photographyStyle?: "blinds" | "flash";
    prompt?: string;
  shots?: Array<{
    pose:
      | "standing-front"
      | "standing-back"
      | "standing-three-quarter"
      | "full-body"
      | "waist-up";
    cutoutImageUrl: string;
    modelReferenceUrl: string;
    prompt?: string;
  }>;
  replaceLifestyleIndex?: number;
}): Promise<OwnerAiModelGenerateResult> {
  const response = await ownerFetch("/api/tr/owner/ai-model/generate", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const data = (await parseOwnerJson(response)) as {
    ok?: boolean;
    result?: OwnerAiModelGenerateResult;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Model görseli üretilemedi.");
  }
  if (!data.result) {
    throw new Error("Model görseli yanıtı eksik.");
  }
  return data.result;
}

export interface TrOwnerSummaryResponse {
  checkoutEnabled: boolean;
  inventory: {
    available: number;
    sold: number;
    hidden: number;
    total: number;
    lowStock?: number;
  };
  period?: {
    range: string;
    orderCount: number;
    revenueKurus: number;
    pendingFulfillment: number;
    topProducts: Array<{
      title: string;
      quantity: number;
      revenueKurus: number;
    }>;
  } | null;
  today: {
    orderCount: number;
    revenueKurus: number;
  } | null;
}

export async function fetchOwnerSummary(
  boutiqueId: string,
  range: "today" | "7d" | "30d" | "all" = "today",
): Promise<TrOwnerSummaryResponse> {
  return cachedOwnerFetch(ownerCacheKeys.summary(boutiqueId, range), async () => {
    const response = await ownerFetch(
      `/api/tr/owner/summary?boutiqueId=${encodeURIComponent(boutiqueId)}&range=${range}`,
    );
    const data = (await parseOwnerJson(response)) as {
      summary?: TrOwnerSummaryResponse;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? "Özet yüklenemedi.");
    }
    if (!data.summary) throw new Error("Özet yüklenemedi.");
    return data.summary;
  });
}

export interface TrOwnerAiCreditUsage {
  period: "month";
  periodLabel: string;
  creditsUsed: number;
  creditsUsd: number;
  creditsTry: number;
  packshotCredits: number;
  modelCredits: number;
  eventCount: number;
}

export async function fetchOwnerAiCredits(
  boutiqueId: string,
): Promise<TrOwnerAiCreditUsage> {
  return cachedOwnerFetch(ownerCacheKeys.credits(boutiqueId), async () => {
    const response = await ownerFetch(
      `/api/tr/owner/ai-credits?boutiqueId=${encodeURIComponent(boutiqueId)}`,
    );
    const data = (await parseOwnerJson(response)) as {
      usage?: TrOwnerAiCreditUsage;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? "Kredi özeti yüklenemedi.");
    }
    if (!data.usage) throw new Error("Kredi özeti yüklenemedi.");
    return data.usage;
  });
}

export async function deleteOwnerProduct(
  productId: string,
): Promise<{ mode: "deleted" | "hidden"; message?: string }> {
  const response = await ownerFetch(
    `/api/tr/owner/products/${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );
  let data: { error?: string; mode?: "deleted" | "hidden"; message?: string };
  try {
    data = (await parseOwnerJson(response)) as typeof data;
  } catch {
    throw new Error(
      response.ok ? "Silme yanıtı okunamadı." : "Ürün silinemedi.",
    );
  }
  if (!response.ok) {
    throw new Error(data.error ?? "Ürün silinemedi.");
  }
  invalidateProductLists();
  return {
    mode: data.mode === "hidden" ? "hidden" : "deleted",
    message: data.message,
  };
}

export async function duplicateOwnerProduct(
  productId: string,
): Promise<TrProduct> {
  const response = await ownerFetch(
    `/api/tr/owner/products/${encodeURIComponent(productId)}`,
    {
      method: "POST",
      body: JSON.stringify({ action: "duplicate" }),
    },
  );
  const data = (await parseOwnerJson(response)) as { product?: TrProduct; error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Ürün kopyalanamadı.");
  }
  if (!data.product) throw new Error("Ürün kopyalanamadı.");
  invalidateProductLists();
  return data.product;
}

export async function fetchOwnerOrders(boutiqueId: string) {
  return cachedOwnerFetch(ownerCacheKeys.orders(boutiqueId), async () => {
    const response = await ownerFetch(
      `/api/tr/owner/orders?boutiqueId=${encodeURIComponent(boutiqueId)}`,
    );
    const data = (await parseOwnerJson(response)) as {
      orders?: import("@/types/tr-marketplace").TrOrderWithItems[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? "Siparişler yüklenemedi.");
    }
    return data.orders ?? [];
  });
}

export async function fetchOwnerOrder(boutiqueId: string, orderId: string) {
  const response = await ownerFetch(
    `/api/tr/owner/orders/${encodeURIComponent(orderId)}?boutiqueId=${encodeURIComponent(boutiqueId)}`,
  );
  const data = (await parseOwnerJson(response)) as {
    order?: import("@/types/tr-marketplace").TrOrderWithItems;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Sipariş yüklenemedi.");
  }
  if (!data.order) throw new Error("Sipariş yüklenemedi.");
  return data.order;
}

export async function updateOwnerOrderFulfillment(
  boutiqueId: string,
  orderId: string,
  fulfillmentStatus: import("@/types/tr-marketplace").TrFulfillmentStatus,
) {
  const response = await ownerFetch(
    `/api/tr/owner/orders/${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ boutiqueId, fulfillmentStatus }),
    },
  );
  const data = (await parseOwnerJson(response)) as {
    order?: import("@/types/tr-marketplace").TrOrderWithItems;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Sipariş güncellenemedi.");
  }
  if (!data.order) throw new Error("Sipariş güncellenemedi.");
  invalidateOrderLists();
  return data.order;
}

/** Mark pending order as paid (manual until iyzico). */
export async function updateOwnerOrderPaymentPaid(
  boutiqueId: string,
  orderId: string,
) {
  const response = await ownerFetch(
    `/api/tr/owner/orders/${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ boutiqueId, paymentStatus: "paid" }),
    },
  );
  const data = (await parseOwnerJson(response)) as {
    order?: import("@/types/tr-marketplace").TrOrderWithItems;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Ödeme durumu güncellenemedi.");
  }
  if (!data.order) throw new Error("Ödeme durumu güncellenemedi.");
  invalidateOrderLists();
  return data.order;
}

export async function fulfillOwnerShipment(boutiqueId: string, orderId: string) {
  const response = await ownerFetch(
    `/api/tr/owner/orders/${encodeURIComponent(orderId)}/shipment`,
    {
      method: "POST",
      body: JSON.stringify({ boutiqueId, action: "fulfill" }),
    },
  );
  return parseShipmentResponse(response, "Etiket üretilemedi.");
}

export async function retryOwnerShipmentAddress(
  boutiqueId: string,
  orderId: string,
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    district: string;
    postalCode: string;
    country: string;
  },
) {
  const response = await ownerFetch(
    `/api/tr/owner/orders/${encodeURIComponent(orderId)}/shipment`,
    {
      method: "POST",
      body: JSON.stringify({
        boutiqueId,
        action: "retry-address",
        shippingAddress,
      }),
    },
  );
  return parseShipmentResponse(response, "Adres kaydedilemedi.");
}

export async function createOwnerShipment(boutiqueId: string, orderId: string) {
  const response = await ownerFetch(
    `/api/tr/owner/orders/${encodeURIComponent(orderId)}/shipment`,
    {
      method: "POST",
      body: JSON.stringify({ boutiqueId, action: "create" }),
    },
  );
  return parseShipmentResponse(response, "Kargo oluşturulamadı.");
}

export async function fetchOwnerShipmentRates(
  boutiqueId: string,
  orderId: string,
) {
  const response = await ownerFetch(
    `/api/tr/owner/orders/${encodeURIComponent(orderId)}/shipment`,
    {
      method: "POST",
      body: JSON.stringify({ boutiqueId, action: "rates" }),
    },
  );
  return parseShipmentResponse(response, "Kargo fiyatları alınamadı.");
}

export async function cancelOwnerShipmentBarcode(
  boutiqueId: string,
  orderId: string,
) {
  const response = await ownerFetch(
    `/api/tr/owner/orders/${encodeURIComponent(orderId)}/shipment`,
    {
      method: "POST",
      body: JSON.stringify({ boutiqueId, action: "cancel" }),
    },
  );
  return parseShipmentResponse(response, "Kargo kodu iptal edilemedi.");
}

export async function fetchOwnerShipmentLabel(
  boutiqueId: string,
  orderId: string,
): Promise<Blob> {
  const response = await ownerFetch(
    `/api/tr/owner/orders/${encodeURIComponent(orderId)}/shipment/label?boutiqueId=${encodeURIComponent(boutiqueId)}`,
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(data.error ?? "Etiket alınamadı.");
  }
  return response.blob();
}

async function parseShipmentResponse(
  response: Response,
  fallback: string,
): Promise<{
  order: TrOrderWithItems;
  rates?: TrShippingRate[];
  trackingPath?: string | null;
}> {
  const data = (await parseOwnerJson(response)) as {
    order?: TrOrderWithItems;
    rates?: TrShippingRate[];
    trackingPath?: string | null;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? fallback);
  }
  if (!data.order) throw new Error(fallback);
  return {
    order: data.order,
    rates: data.rates,
    trackingPath: data.trackingPath,
  };
}

export async function fetchOwnerCustomers(boutiqueId: string) {
  return cachedOwnerFetch(ownerCacheKeys.customers(boutiqueId), async () => {
    const response = await ownerFetch(
      `/api/tr/owner/customers?boutiqueId=${encodeURIComponent(boutiqueId)}`,
    );
    const data = (await parseOwnerJson(response)) as {
      customers?: import("@/types/tr-marketplace").TrOwnerCustomer[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? "Müşteriler yüklenemedi.");
    }
    return data.customers ?? [];
  });
}

export async function fetchOwnerDiscountCodes(boutiqueId: string) {
  return cachedOwnerFetch(ownerCacheKeys.discounts(boutiqueId), async () => {
    const response = await ownerFetch(
      `/api/tr/owner/discounts?boutiqueId=${encodeURIComponent(boutiqueId)}`,
    );
    const data = (await parseOwnerJson(response)) as {
      codes?: import("@/types/tr-marketplace").TrDiscountCode[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? "Kuponlar yüklenemedi.");
    }
    return data.codes ?? [];
  });
}

export async function createOwnerDiscountCode(
  boutiqueId: string,
  payload: {
    code: string;
    percentOff?: number;
    amountOffTry?: number;
    usageLimit?: number | null;
  },
) {
  const response = await ownerFetch("/api/tr/owner/discounts", {
    method: "POST",
    body: JSON.stringify({ boutiqueId, ...payload }),
  });
  const data = (await parseOwnerJson(response)) as {
    code?: import("@/types/tr-marketplace").TrDiscountCode;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Kupon oluşturulamadı.");
  }
  if (!data.code) throw new Error("Kupon oluşturulamadı.");
  invalidateOwnerCache("discounts:");
  return data.code;
}

export async function setOwnerDiscountCodeActive(
  boutiqueId: string,
  codeId: string,
  active: boolean,
) {
  const response = await ownerFetch(
    `/api/tr/owner/discounts/${encodeURIComponent(codeId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ boutiqueId, active }),
    },
  );
  const data = (await parseOwnerJson(response)) as {
    code?: import("@/types/tr-marketplace").TrDiscountCode;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Kupon güncellenemedi.");
  }
  if (!data.code) throw new Error("Kupon güncellenemedi.");
  invalidateOwnerCache("discounts:");
  return data.code;
}

export async function fetchOwnerContentPacks(boutiqueId: string) {
  const response = await ownerFetch(
    `/api/tr/owner/content-packs?boutiqueId=${encodeURIComponent(boutiqueId)}`,
  );
  const data = (await parseOwnerJson(response)) as {
    packs?: import("@/lib/tr/contentPacks").TrContentPack[];
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "İçerik paketleri yüklenemedi.");
  }
  return data.packs ?? [];
}

export async function fetchOwnerContentPack(packId: string) {
  const response = await ownerFetch(
    `/api/tr/owner/content-packs/${encodeURIComponent(packId)}`,
  );
  const data = (await parseOwnerJson(response)) as {
    pack?: import("@/lib/tr/contentPacks").TrContentPack;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "İçerik paketi yüklenemedi.");
  }
  if (!data.pack) throw new Error("İçerik paketi bulunamadı.");
  return data.pack;
}

export async function createOwnerContentPack(
  boutiqueId: string,
  productId: string,
): Promise<{
  pack: import("@/lib/tr/contentPacks").TrContentPack;
  warning: string | null;
}> {
  const response = await ownerFetch("/api/tr/owner/content-packs", {
    method: "POST",
    body: JSON.stringify({ boutiqueId, productId }),
  });
  const data = (await parseOwnerJson(response)) as {
    pack?: import("@/lib/tr/contentPacks").TrContentPack;
    warning?: string | null;
    error?: string;
  };
  if (!response.ok && !data.pack) {
    throw new Error(data.error ?? "İçerik paketi oluşturulamadı.");
  }
  if (!data.pack) {
    throw new Error(data.error ?? "İçerik paketi oluşturulamadı.");
  }
  return {
    pack: data.pack,
    warning: data.warning ?? data.error ?? null,
  };
}

export interface TrOwnerBoutiqueSettings {
  id: string;
  slug: string;
  name: string;
  legalName: string | null;
  description: string | null;
  logoUrl: string | null;
  whatsappPhone: string | null;
  instagramHandle: string | null;
  shippingNote: string | null;
  exchangePolicy: string | null;
  physicalAddress: string | null;
  themeAccent: string | null;
  vergiNo: string | null;
  iban: string | null;
  status: string;
}

export async function fetchOwnerBoutiqueSettings(
  boutiqueId: string,
): Promise<TrOwnerBoutiqueSettings> {
  return cachedOwnerFetch(ownerCacheKeys.settings(boutiqueId), async () => {
    const response = await ownerFetch(
      `/api/tr/owner/boutiques/${encodeURIComponent(boutiqueId)}`,
    );
    const data = (await parseOwnerJson(response)) as {
      boutique?: TrOwnerBoutiqueSettings;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? "Butik yüklenemedi.");
    }
    if (!data.boutique) throw new Error("Butik yüklenemedi.");
    return data.boutique;
  });
}

export async function updateOwnerBoutiqueSettings(
  boutiqueId: string,
  payload: Partial<
    Pick<
      TrOwnerBoutiqueSettings,
      | "description"
      | "logoUrl"
      | "whatsappPhone"
      | "instagramHandle"
      | "shippingNote"
      | "exchangePolicy"
      | "physicalAddress"
      | "themeAccent"
      | "legalName"
      | "vergiNo"
      | "iban"
    >
  >,
): Promise<TrOwnerBoutiqueSettings> {
  const response = await ownerFetch(
    `/api/tr/owner/boutiques/${encodeURIComponent(boutiqueId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
  const data = (await parseOwnerJson(response)) as {
    boutique?: TrOwnerBoutiqueSettings;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Butik güncellenemedi.");
  }
  if (!data.boutique) throw new Error("Butik güncellenemedi.");
  invalidateOwnerCache(ownerCacheKeys.boutiques);
  invalidateOwnerCache(ownerCacheKeys.settings(boutiqueId));
  return data.boutique;
}

export async function fetchOwnerBoutiqueOptions(boutiqueId: string): Promise<{
  sizePresets: string[];
  colorPresets: TrProductColor[];
}> {
  const response = await ownerFetch(
    `/api/tr/owner/boutiques/${encodeURIComponent(boutiqueId)}/options`,
  );
  const data = (await parseOwnerJson(response)) as {
    sizePresets?: string[];
    colorPresets?: TrProductColor[];
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Seçenekler yüklenemedi.");
  }
  return {
    sizePresets: data.sizePresets ?? [],
    colorPresets: data.colorPresets ?? [],
  };
}

export async function updateOwnerBoutiqueOptions(
  boutiqueId: string,
  payload: {
    sizePresets?: string[];
    colorPresets?: TrProductColor[];
  },
): Promise<{
  sizePresets: string[];
  colorPresets: TrProductColor[];
}> {
  const response = await ownerFetch(
    `/api/tr/owner/boutiques/${encodeURIComponent(boutiqueId)}/options`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
  const data = (await parseOwnerJson(response)) as {
    sizePresets?: string[];
    colorPresets?: TrProductColor[];
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Seçenekler kaydedilemedi.");
  }
  return {
    sizePresets: data.sizePresets ?? [],
    colorPresets: data.colorPresets ?? [],
  };
}

export async function fetchOwnerInvoices(
  boutiqueId: string,
): Promise<TrInvoice[]> {
  return cachedOwnerFetch(ownerCacheKeys.invoices(boutiqueId), async () => {
    const response = await ownerFetch(
      `/api/tr/owner/invoices?boutiqueId=${encodeURIComponent(boutiqueId)}`,
    );
    const data = (await parseOwnerJson(response)) as {
      invoices?: TrInvoice[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? "Faturalar yüklenemedi.");
    }
    return data.invoices ?? [];
  });
}

export async function createOwnerInvoiceDraft(
  boutiqueId: string,
  orderId: string,
): Promise<TrInvoice> {
  const response = await ownerFetch(`/api/tr/owner/invoices`, {
    method: "POST",
    body: JSON.stringify({ boutiqueId, orderId }),
  });
  const data = (await parseOwnerJson(response)) as {
    invoice?: TrInvoice;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Fatura kaydı oluşturulamadı.");
  }
  if (!data.invoice) throw new Error("Fatura kaydı oluşturulamadı.");
  return data.invoice;
}

export async function updateOwnerInvoice(
  invoiceId: string,
  payload: {
    boutiqueId: string;
    status?: TrInvoiceStatus;
    externalInvoiceNo?: string | null;
    notes?: string | null;
  },
): Promise<TrInvoice> {
  const response = await ownerFetch(
    `/api/tr/owner/invoices/${encodeURIComponent(invoiceId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
  const data = (await parseOwnerJson(response)) as {
    invoice?: TrInvoice;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Fatura güncellenemedi.");
  }
  if (!data.invoice) throw new Error("Fatura güncellenemedi.");
  return data.invoice;
}
