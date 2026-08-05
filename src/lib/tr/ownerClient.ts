import { getSupabaseClient } from "@/lib/supabaseClient";
import { prepareOwnerUploadFile } from "@/lib/tr/prepareOwnerUploadFile";
import type { TrProduct, TrProductColor, TrProductStatus } from "@/types/tr-marketplace";

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

export async function fetchOwnerBoutiques(): Promise<TrOwnerBoutiqueSummary[]> {
  const response = await ownerFetch("/api/tr/owner/boutiques");
  const data = (await response.json()) as {
    boutiques?: TrOwnerBoutiqueSummary[];
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Butikler yüklenemedi.");
  }
  return data.boutiques ?? [];
}

export async function fetchOwnerProducts(boutiqueId: string): Promise<{
  boutique: TrOwnerBoutiqueSummary;
  products: TrProduct[];
}> {
  const response = await ownerFetch(
    `/api/tr/owner/products?boutiqueId=${encodeURIComponent(boutiqueId)}`,
  );
  const data = (await response.json()) as {
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
}

export async function fetchOwnerProduct(productId: string): Promise<{
  product: TrProduct;
  boutique: TrOwnerBoutiqueSummary;
}> {
  const response = await ownerFetch(
    `/api/tr/owner/products/${encodeURIComponent(productId)}`,
  );
  const data = (await response.json()) as {
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
  const data = (await response.json()) as { product?: TrProduct; error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Ürün oluşturulamadı.");
  }
  if (!data.product) throw new Error("Ürün oluşturulamadı.");
  return data.product;
}

export async function updateOwnerProduct(
  productId: string,
  payload: Omit<TrOwnerProductPayload, "boutiqueId"> & {
    boutiqueId?: string;
  },
): Promise<TrProduct> {
  const response = await ownerFetch(
    `/api/tr/owner/products/${encodeURIComponent(productId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
  const data = (await response.json()) as { product?: TrProduct; error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Ürün güncellenemedi.");
  }
  if (!data.product) throw new Error("Ürün güncellenemedi.");
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
    data = (await response.json()) as typeof data;
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
  view?: "front" | "back" | "extra";
  promptExtra?: string;
  /** From prepare-packshot — avoids a second Gemini call. */
  prompt?: string;
  listingDraft?: OwnerListingDraft | null;
  numImages?: number;
}): Promise<OwnerPackshotResult> {
  const response = await ownerFetch("/api/tr/owner/ai-catalog/packshot", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as {
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
  title?: string;
  category?: string | null;
  view?: "front" | "back" | "extra";
  promptExtra?: string;
}): Promise<OwnerPackshotPrepareResult> {
  const response = await ownerFetch(
    "/api/tr/owner/ai-catalog/prepare-packshot",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  const data = (await response.json()) as {
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
    listingDraft: data.listingDraft?.title?.trim()
      ? {
          title: data.listingDraft.title.trim(),
          description: data.listingDraft.description?.trim() ?? "",
        }
      : null,
    usedGemini: Boolean(data.usedGemini),
  };
}

export async function requestOwnerListingDraft(input: {
  boutiqueId: string;
  sourceImageUrl: string;
  category?: string | null;
}): Promise<OwnerListingDraft> {
  const response = await ownerFetch("/api/tr/owner/ai-catalog/listing-draft", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as {
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
  return data.draft;
}

export interface OwnerAiModelGenerateResult {
  status: string;
  providerId?: string;
  imageUrl?: string;
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
  pose?: "standing-front" | "standing-three-quarter" | "full-body" | "waist-up";
  modelId?: string;
}): Promise<OwnerAiModelGenerateResult> {
  const response = await ownerFetch("/api/tr/owner/ai-model/generate", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as {
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
  const response = await ownerFetch(
    `/api/tr/owner/summary?boutiqueId=${encodeURIComponent(boutiqueId)}&range=${range}`,
  );
  const data = (await response.json()) as {
    summary?: TrOwnerSummaryResponse;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Özet yüklenemedi.");
  }
  if (!data.summary) throw new Error("Özet yüklenemedi.");
  return data.summary;
}

export async function deleteOwnerProduct(productId: string): Promise<void> {
  const response = await ownerFetch(
    `/api/tr/owner/products/${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );
  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Ürün silinemedi.");
  }
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
  const data = (await response.json()) as { product?: TrProduct; error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Ürün kopyalanamadı.");
  }
  if (!data.product) throw new Error("Ürün kopyalanamadı.");
  return data.product;
}

export async function fetchOwnerOrders(boutiqueId: string) {
  const response = await ownerFetch(
    `/api/tr/owner/orders?boutiqueId=${encodeURIComponent(boutiqueId)}`,
  );
  const data = (await response.json()) as {
    orders?: import("@/types/tr-marketplace").TrOrderWithItems[];
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Siparişler yüklenemedi.");
  }
  return data.orders ?? [];
}

export async function fetchOwnerOrder(boutiqueId: string, orderId: string) {
  const response = await ownerFetch(
    `/api/tr/owner/orders/${encodeURIComponent(orderId)}?boutiqueId=${encodeURIComponent(boutiqueId)}`,
  );
  const data = (await response.json()) as {
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
  const data = (await response.json()) as {
    order?: import("@/types/tr-marketplace").TrOrderWithItems;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Sipariş güncellenemedi.");
  }
  if (!data.order) throw new Error("Sipariş güncellenemedi.");
  return data.order;
}

export async function fetchOwnerCustomers(boutiqueId: string) {
  const response = await ownerFetch(
    `/api/tr/owner/customers?boutiqueId=${encodeURIComponent(boutiqueId)}`,
  );
  const data = (await response.json()) as {
    customers?: import("@/types/tr-marketplace").TrOwnerCustomer[];
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Müşteriler yüklenemedi.");
  }
  return data.customers ?? [];
}

export async function fetchOwnerDiscountCodes(boutiqueId: string) {
  const response = await ownerFetch(
    `/api/tr/owner/discounts?boutiqueId=${encodeURIComponent(boutiqueId)}`,
  );
  const data = (await response.json()) as {
    codes?: import("@/types/tr-marketplace").TrDiscountCode[];
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Kuponlar yüklenemedi.");
  }
  return data.codes ?? [];
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
  const data = (await response.json()) as {
    code?: import("@/types/tr-marketplace").TrDiscountCode;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Kupon oluşturulamadı.");
  }
  if (!data.code) throw new Error("Kupon oluşturulamadı.");
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
  const data = (await response.json()) as {
    code?: import("@/types/tr-marketplace").TrDiscountCode;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Kupon güncellenemedi.");
  }
  if (!data.code) throw new Error("Kupon güncellenemedi.");
  return data.code;
}

export async function fetchOwnerContentPacks(boutiqueId: string) {
  const response = await ownerFetch(
    `/api/tr/owner/content-packs?boutiqueId=${encodeURIComponent(boutiqueId)}`,
  );
  const data = (await response.json()) as {
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
  const data = (await response.json()) as {
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
  const data = (await response.json()) as {
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
  description: string | null;
  logoUrl: string | null;
  whatsappPhone: string | null;
  instagramHandle: string | null;
  shippingNote: string | null;
  exchangePolicy: string | null;
  physicalAddress: string | null;
  themeAccent: string | null;
  status: string;
}

export async function fetchOwnerBoutiqueSettings(
  boutiqueId: string,
): Promise<TrOwnerBoutiqueSettings> {
  const response = await ownerFetch(
    `/api/tr/owner/boutiques/${encodeURIComponent(boutiqueId)}`,
  );
  const data = (await response.json()) as {
    boutique?: TrOwnerBoutiqueSettings;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Butik yüklenemedi.");
  }
  if (!data.boutique) throw new Error("Butik yüklenemedi.");
  return data.boutique;
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
  const data = (await response.json()) as {
    boutique?: TrOwnerBoutiqueSettings;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Butik güncellenemedi.");
  }
  if (!data.boutique) throw new Error("Butik güncellenemedi.");
  return data.boutique;
}

export async function fetchOwnerBoutiqueOptions(boutiqueId: string): Promise<{
  sizePresets: string[];
  colorPresets: TrProductColor[];
}> {
  const response = await ownerFetch(
    `/api/tr/owner/boutiques/${encodeURIComponent(boutiqueId)}/options`,
  );
  const data = (await response.json()) as {
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
  const data = (await response.json()) as {
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
