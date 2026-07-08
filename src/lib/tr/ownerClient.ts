import { getSupabaseClient } from "@/lib/supabaseClient";
import type { TrProduct, TrProductColor, TrProductStatus } from "@/types/tr-marketplace";

export interface TrOwnerBoutiqueSummary {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
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
  sizes: string[];
  colors: TrProductColor[];
  category: string | null;
  images: string[];
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

export async function uploadOwnerProductImage(
  boutiqueId: string,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.set("boutiqueId", boutiqueId);
  formData.set("file", file);

  const response = await ownerFetch("/api/tr/owner/upload", {
    method: "POST",
    body: formData,
  });
  const data = (await response.json()) as { url?: string; error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Fotoğraf yüklenemedi.");
  }
  if (!data.url) throw new Error("Fotoğraf yüklenemedi.");
  return data.url;
}
