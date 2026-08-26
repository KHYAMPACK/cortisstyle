import { getServiceSupabase } from "@/lib/supabaseAdmin";
import {
  isValidCustomerPhone,
  normalizeCustomerPhone,
  sanitizePersonName,
} from "@/lib/auth/customerProfileFields";
import {
  TR_CUSTOMER_ADDRESS_LABEL_MAX,
  TR_CUSTOMER_ADDRESS_MAX,
} from "@/lib/tr/commerce/customerAddressLimits";
import { validateTurkeyShippingAddress } from "@/lib/tr/geo/turkeyAddress";
import type {
  TrCustomerAddress,
  TrCustomerAddressInput,
  TrCustomerAddressPatch,
  TrShippingAddress,
} from "@/types/tr-marketplace";

export {
  TR_CUSTOMER_ADDRESS_LABEL_MAX,
  TR_CUSTOMER_ADDRESS_MAX,
} from "@/lib/tr/commerce/customerAddressLimits";

type AddressRow = {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  district: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export class CustomerAddressError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CustomerAddressError";
    this.status = status;
  }
}

function requireService() {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new CustomerAddressError(
      "Adres defteri şu an kullanılamıyor.",
      500,
    );
  }
  return supabase;
}

function mapRow(row: AddressRow): TrCustomerAddress {
  return {
    id: row.id,
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2?.trim() || undefined,
    district: row.district,
    city: row.city,
    postalCode: row.postal_code,
    country: row.country || "TR",
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sanitizeLabel(raw: string): string | CustomerAddressError {
  const label = raw.trim().replace(/\s+/g, " ").slice(0, TR_CUSTOMER_ADDRESS_LABEL_MAX);
  if (!label) {
    return new CustomerAddressError("Adres adı yazın (Ev, İş…).", 400);
  }
  return label;
}

function sanitizeRecipient(raw: string): string | CustomerAddressError {
  const name = sanitizePersonName(raw);
  if (name.length < 2) {
    return new CustomerAddressError("Geçerli bir alıcı adı yazın.", 400);
  }
  return name;
}

function sanitizePhone(raw: string): string | CustomerAddressError {
  if (!isValidCustomerPhone(raw)) {
    return new CustomerAddressError(
      "Geçerli bir telefon numarası yazın.",
      400,
    );
  }
  return normalizeCustomerPhone(raw);
}

function validateFields(input: {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  district: string;
  city: string;
  postalCode: string;
  country?: string;
}):
  | { ok: true; row: Omit<AddressRow, "id" | "user_id" | "is_default" | "created_at" | "updated_at"> }
  | { ok: false; error: CustomerAddressError } {
  const label = sanitizeLabel(input.label);
  if (label instanceof CustomerAddressError) return { ok: false, error: label };
  const recipientName = sanitizeRecipient(input.recipientName);
  if (recipientName instanceof CustomerAddressError) {
    return { ok: false, error: recipientName };
  }
  const phone = sanitizePhone(input.phone);
  if (phone instanceof CustomerAddressError) return { ok: false, error: phone };

  const validated = validateTurkeyShippingAddress({
    line1: input.line1,
    line2: input.line2,
    city: input.city,
    district: input.district,
    postalCode: input.postalCode,
    country: input.country,
  });
  if (!validated.ok) {
    return {
      ok: false,
      error: new CustomerAddressError(validated.error, 400),
    };
  }

  return {
    ok: true,
    row: {
      label,
      recipient_name: recipientName,
      phone,
      line1: validated.address.line1,
      line2: validated.address.line2 ?? null,
      district: validated.address.district,
      city: validated.address.city,
      postal_code: validated.address.postalCode,
      country: validated.address.country ?? "TR",
    },
  };
}

async function clearDefault(
  userId: string,
): Promise<void> {
  const supabase = requireService();
  const { error } = await supabase
    .from("tr_customer_addresses")
    .update({ is_default: false })
    .eq("user_id", userId)
    .eq("is_default", true);
  if (error) {
    throw new CustomerAddressError("Adres kaydedilemedi.", 500);
  }
}

export function customerAddressToShipping(
  address: TrCustomerAddress,
): TrShippingAddress {
  return {
    line1: address.line1,
    line2: address.line2,
    district: address.district,
    city: address.city,
    postalCode: address.postalCode,
    country: address.country || "TR",
  };
}

export async function listCustomerAddresses(
  userId: string,
): Promise<TrCustomerAddress[]> {
  const supabase = requireService();
  const { data, error } = await supabase
    .from("tr_customer_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("tr_customer_addresses list failed:", error.message);
    throw new CustomerAddressError("Adresler yüklenemedi.", 500);
  }

  return ((data ?? []) as AddressRow[]).map(mapRow);
}

export async function createCustomerAddress(
  userId: string,
  input: TrCustomerAddressInput,
): Promise<TrCustomerAddress> {
  const supabase = requireService();
  const parsed = validateFields(input);
  if (!parsed.ok) throw parsed.error;

  const existing = await listCustomerAddresses(userId);
  if (existing.length >= TR_CUSTOMER_ADDRESS_MAX) {
    throw new CustomerAddressError(
      `En fazla ${TR_CUSTOMER_ADDRESS_MAX} adres kaydedebilirsiniz.`,
      400,
    );
  }

  const makeDefault = input.isDefault === true || existing.length === 0;
  if (makeDefault) {
    await clearDefault(userId);
  }

  const { data, error } = await supabase
    .from("tr_customer_addresses")
    .insert({
      user_id: userId,
      ...parsed.row,
      is_default: makeDefault,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("tr_customer_addresses insert failed:", error?.message);
    throw new CustomerAddressError("Adres kaydedilemedi.", 500);
  }

  return mapRow(data as AddressRow);
}

export async function updateCustomerAddress(
  userId: string,
  id: string,
  patch: TrCustomerAddressPatch,
): Promise<TrCustomerAddress> {
  const supabase = requireService();
  const { data: current, error: readError } = await supabase
    .from("tr_customer_addresses")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    console.error("tr_customer_addresses read failed:", readError.message);
    throw new CustomerAddressError("Adres güncellenemedi.", 500);
  }
  if (!current) {
    throw new CustomerAddressError("Adres bulunamadı.", 404);
  }

  const row = current as AddressRow;
  const merged = {
    label: patch.label ?? row.label,
    recipientName: patch.recipientName ?? row.recipient_name,
    phone: patch.phone ?? row.phone,
    line1: patch.line1 ?? row.line1,
    line2: patch.line2 !== undefined ? patch.line2 : (row.line2 ?? undefined),
    district: patch.district ?? row.district,
    city: patch.city ?? row.city,
    postalCode: patch.postalCode ?? row.postal_code,
    country: patch.country ?? row.country,
  };
  const parsed = validateFields(merged);
  if (!parsed.ok) throw parsed.error;

  const makeDefault = patch.isDefault === true;
  if (makeDefault && !row.is_default) {
    await clearDefault(userId);
  }

  const nextDefault =
    patch.isDefault === undefined ? row.is_default : makeDefault;

  const { data, error } = await supabase
    .from("tr_customer_addresses")
    .update({
      ...parsed.row,
      is_default: nextDefault,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("tr_customer_addresses update failed:", error?.message);
    throw new CustomerAddressError("Adres güncellenemedi.", 500);
  }

  return mapRow(data as AddressRow);
}

export async function deleteCustomerAddress(
  userId: string,
  id: string,
): Promise<void> {
  const supabase = requireService();
  const { data: current, error: readError } = await supabase
    .from("tr_customer_addresses")
    .select("id, is_default")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    console.error("tr_customer_addresses delete read failed:", readError.message);
    throw new CustomerAddressError("Adres silinemedi.", 500);
  }
  if (!current) {
    throw new CustomerAddressError("Adres bulunamadı.", 404);
  }

  const { error } = await supabase
    .from("tr_customer_addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("tr_customer_addresses delete failed:", error.message);
    throw new CustomerAddressError("Adres silinemedi.", 500);
  }

  if (current.is_default) {
    const remaining = await listCustomerAddresses(userId);
    const next = remaining[0];
    if (next) {
      await supabase
        .from("tr_customer_addresses")
        .update({ is_default: true })
        .eq("id", next.id)
        .eq("user_id", userId);
    }
  }
}

export function parseCustomerAddressBody(
  body: unknown,
): TrCustomerAddressInput {
  if (!body || typeof body !== "object") {
    throw new CustomerAddressError("Geçersiz istek.", 400);
  }
  const record = body as Record<string, unknown>;
  const str = (key: string) =>
    typeof record[key] === "string" ? (record[key] as string) : "";

  return {
    label: str("label"),
    recipientName: str("recipientName"),
    phone: str("phone"),
    line1: str("line1"),
    line2: str("line2") || undefined,
    district: str("district"),
    city: str("city"),
    postalCode: str("postalCode"),
    country: str("country") || "TR",
    isDefault: record.isDefault === true,
  };
}

export function parseCustomerAddressPatch(body: unknown): TrCustomerAddressPatch {
  if (!body || typeof body !== "object") {
    throw new CustomerAddressError("Geçersiz istek.", 400);
  }
  const record = body as Record<string, unknown>;
  const patch: TrCustomerAddressPatch = {};
  const take = (key: keyof TrCustomerAddressInput, raw: string) => {
    if (typeof record[raw] === "string") {
      (patch as Record<string, unknown>)[key] = record[raw];
    }
  };
  take("label", "label");
  take("recipientName", "recipientName");
  take("phone", "phone");
  take("line1", "line1");
  take("line2", "line2");
  take("district", "district");
  take("city", "city");
  take("postalCode", "postalCode");
  take("country", "country");
  if (typeof record.isDefault === "boolean") {
    patch.isDefault = record.isDefault;
  }
  if (Object.keys(patch).length === 0) {
    throw new CustomerAddressError("Güncellenecek alan yok.", 400);
  }
  return patch;
}
