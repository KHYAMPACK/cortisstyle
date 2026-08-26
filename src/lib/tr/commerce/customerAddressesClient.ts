import { getSupabaseClient } from "@/lib/supabaseClient";
import type { TrCheckoutFormData } from "@/types/tr-cart";
import type {
  TrCustomerAddress,
  TrCustomerAddressInput,
  TrCustomerAddressPatch,
} from "@/types/tr-marketplace";

export {
  TR_CUSTOMER_ADDRESS_LABEL_MAX,
  TR_CUSTOMER_ADDRESS_MAX,
} from "@/lib/tr/commerce/customerAddressLimits";

export function applyCustomerAddressToCheckoutForm(
  form: TrCheckoutFormData,
  address: TrCustomerAddress,
): TrCheckoutFormData {
  return {
    ...form,
    customerName: address.recipientName.trim() || form.customerName,
    customerPhone: address.phone.trim() || form.customerPhone,
    line1: address.line1,
    line2: address.line2 ?? "",
    district: address.district,
    city: address.city,
    postalCode: address.postalCode,
    country: address.country || "TR",
  };
}

async function authHeaders(): Promise<HeadersInit | null> {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error?.trim()) return body.error.trim();
  } catch {
    // ignore
  }
  return "İşlem başarısız. Tekrar deneyin.";
}

export async function fetchCustomerAddresses(): Promise<
  | { ok: true; addresses: TrCustomerAddress[] }
  | { ok: false; error: string; status: number }
> {
  const headers = await authHeaders();
  if (!headers) {
    return { ok: false, error: "Giriş yapmanız gerekir.", status: 401 };
  }

  const response = await fetch("/api/tr/customer/addresses", { headers });
  if (!response.ok) {
    return {
      ok: false,
      error: await readError(response),
      status: response.status,
    };
  }
  const body = (await response.json()) as { addresses?: TrCustomerAddress[] };
  return { ok: true, addresses: body.addresses ?? [] };
}

export async function createCustomerAddressRequest(
  input: TrCustomerAddressInput,
): Promise<
  | { ok: true; address: TrCustomerAddress }
  | { ok: false; error: string; status: number }
> {
  const headers = await authHeaders();
  if (!headers) {
    return { ok: false, error: "Giriş yapmanız gerekir.", status: 401 };
  }

  const response = await fetch("/api/tr/customer/addresses", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    return {
      ok: false,
      error: await readError(response),
      status: response.status,
    };
  }
  const body = (await response.json()) as { address: TrCustomerAddress };
  return { ok: true, address: body.address };
}

export async function updateCustomerAddressRequest(
  id: string,
  patch: TrCustomerAddressPatch,
): Promise<
  | { ok: true; address: TrCustomerAddress }
  | { ok: false; error: string; status: number }
> {
  const headers = await authHeaders();
  if (!headers) {
    return { ok: false, error: "Giriş yapmanız gerekir.", status: 401 };
  }

  const response = await fetch(
    `/api/tr/customer/addresses/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(patch),
    },
  );
  if (!response.ok) {
    return {
      ok: false,
      error: await readError(response),
      status: response.status,
    };
  }
  const body = (await response.json()) as { address: TrCustomerAddress };
  return { ok: true, address: body.address };
}

export async function deleteCustomerAddressRequest(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const headers = await authHeaders();
  if (!headers) {
    return { ok: false, error: "Giriş yapmanız gerekir.", status: 401 };
  }

  const response = await fetch(
    `/api/tr/customer/addresses/${encodeURIComponent(id)}`,
    { method: "DELETE", headers },
  );
  if (!response.ok) {
    return {
      ok: false,
      error: await readError(response),
      status: response.status,
    };
  }
  return { ok: true };
}
