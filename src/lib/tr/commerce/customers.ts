import { getServiceSupabase } from "@/lib/supabaseAdmin";
import {
  normalizeCustomerEmail,
  type CustomerInput,
} from "@/lib/tr/customers/customerModel";
import type {
  TrBoutiqueCustomer,
  TrBoutiqueCustomerAddress,
  TrShippingAddress,
} from "@/types/tr-marketplace";

const TABLE = "tr_customers";
const UNIQUE_VIOLATION = "23505";

/** Another customer of this boutique already has that e-mail. */
export class CustomerEmailTakenError extends Error {
  constructor(readonly existingCustomerId: string | null) {
    super("Bu e-posta ile kayıtlı bir müşteri zaten var.");
    this.name = "CustomerEmailTakenError";
  }
}

/** The patch that creates the table has not been applied to this database. */
export class CustomersNotSetUpError extends Error {
  constructor() {
    super("Müşteriler henüz kurulmadı. Destek ekibiyle iletişime geçin.");
    this.name = "CustomersNotSetUpError";
  }
}

function errorCode(error: unknown): string | null {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : null;
}

/** Postgres "undefined table" or PostgREST's "not in the schema cache". */
function isMissingTable(error: unknown): boolean {
  const code = errorCode(error);
  return code === "42P01" || code === "PGRST205";
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readAddresses(value: unknown): TrBoutiqueCustomerAddress[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index): TrBoutiqueCustomerAddress[] => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    return [
      {
        id: text(record.id) || `address-${index}`,
        title: text(record.title) || "Adres",
        name: text(record.name),
        line1: text(record.line1),
        line2: text(record.line2),
        district: text(record.district),
        city: text(record.city),
        postalCode: text(record.postalCode),
        country: text(record.country) || "TR",
        isDefault: record.isDefault === true,
      },
    ];
  });
}

export function mapCustomerRow(row: Record<string, unknown>): TrBoutiqueCustomer {
  return {
    id: row.id as string,
    boutiqueId: row.boutique_id as string,
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    addresses: readAddresses(row.addresses),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function service() {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

/** Every customer of a boutique, newest first. */
export async function listCustomersAdmin(
  boutiqueId: string,
): Promise<TrBoutiqueCustomer[]> {
  const { data, error } = await service()
    .from(TABLE)
    .select("*")
    .eq("boutique_id", boutiqueId)
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingTable(error)) throw new CustomersNotSetUpError();
    throw error;
  }
  return (data ?? []).map((row) => mapCustomerRow(row as Record<string, unknown>));
}

export async function getCustomerAdmin(
  boutiqueId: string,
  customerId: string,
): Promise<TrBoutiqueCustomer | null> {
  const { data, error } = await service()
    .from(TABLE)
    .select("*")
    .eq("id", customerId)
    .eq("boutique_id", boutiqueId)
    .maybeSingle();
  if (error) {
    if (isMissingTable(error)) throw new CustomersNotSetUpError();
    throw error;
  }
  return data ? mapCustomerRow(data as Record<string, unknown>) : null;
}

async function customerIdByEmail(
  boutiqueId: string,
  email: string,
): Promise<string | null> {
  const { data } = await service()
    .from(TABLE)
    .select("id")
    .eq("boutique_id", boutiqueId)
    .eq("email", email)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function createCustomerAdmin(
  boutiqueId: string,
  input: CustomerInput,
): Promise<TrBoutiqueCustomer> {
  const { data, error } = await service()
    .from(TABLE)
    .insert({
      boutique_id: boutiqueId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      note: input.note,
      addresses: input.addresses,
    })
    .select("*")
    .single();
  if (error) {
    if (isMissingTable(error)) throw new CustomersNotSetUpError();
    if (errorCode(error) === UNIQUE_VIOLATION) {
      throw new CustomerEmailTakenError(
        await customerIdByEmail(boutiqueId, input.email),
      );
    }
    throw error;
  }
  return mapCustomerRow(data as Record<string, unknown>);
}

/** The updated customer, or null when this boutique has no such customer. */
export async function updateCustomerAdmin(
  boutiqueId: string,
  customerId: string,
  input: CustomerInput,
): Promise<TrBoutiqueCustomer | null> {
  const { data, error } = await service()
    .from(TABLE)
    .update({
      name: input.name,
      email: input.email,
      phone: input.phone,
      note: input.note,
      addresses: input.addresses,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId)
    .eq("boutique_id", boutiqueId)
    .select("*")
    .maybeSingle();
  if (error) {
    if (isMissingTable(error)) throw new CustomersNotSetUpError();
    if (errorCode(error) === UNIQUE_VIOLATION) {
      throw new CustomerEmailTakenError(
        await customerIdByEmail(boutiqueId, input.email),
      );
    }
    throw error;
  }
  return data ? mapCustomerRow(data as Record<string, unknown>) : null;
}

/** Deleting a customer keeps their orders: each order carries its own name / e-mail. */
export async function deleteCustomerAdmin(
  boutiqueId: string,
  customerId: string,
): Promise<boolean> {
  const { data, error } = await service()
    .from(TABLE)
    .delete()
    .eq("id", customerId)
    .eq("boutique_id", boutiqueId)
    .select("id");
  if (error) {
    if (isMissingTable(error)) throw new CustomersNotSetUpError();
    throw error;
  }
  return (data ?? []).length > 0;
}

/**
 * The customer an order belongs to: found by e-mail, or created from the order.
 * A new customer starts with the order's delivery address; an existing one with no
 * address gets it too.
 *
 * Never throws. A sale must not fail because of the customer step — if the table
 * is missing, or anything else goes wrong, the order is placed without a link and
 * the problem is logged.
 */
export async function ensureCustomerForOrderAdmin(input: {
  boutiqueId: string;
  name: string;
  email: string;
  phone: string | null;
  shippingAddress: TrShippingAddress;
}): Promise<string | null> {
  try {
    const supabase = service();
    const email = normalizeCustomerEmail(input.email);
    if (!email) return null;

    const address: TrBoutiqueCustomerAddress = {
      id: globalThis.crypto.randomUUID(),
      title: "Teslimat adresi",
      name: input.name.trim(),
      line1: input.shippingAddress.line1,
      line2: input.shippingAddress.line2 ?? "",
      district: input.shippingAddress.district,
      city: input.shippingAddress.city,
      postalCode: input.shippingAddress.postalCode,
      country: input.shippingAddress.country || "TR",
      isDefault: true,
    };

    const found = await supabase
      .from(TABLE)
      .select("id, addresses")
      .eq("boutique_id", input.boutiqueId)
      .eq("email", email)
      .maybeSingle();
    if (found.error) throw found.error;

    if (found.data) {
      const id = found.data.id as string;
      if (readAddresses(found.data.addresses).length === 0) {
        await supabase
          .from(TABLE)
          .update({ addresses: [address], updated_at: new Date().toISOString() })
          .eq("id", id);
      }
      return id;
    }

    const inserted = await supabase
      .from(TABLE)
      .insert({
        boutique_id: input.boutiqueId,
        name: input.name.trim(),
        email,
        phone: input.phone?.trim() || null,
        addresses: [address],
      })
      .select("id")
      .single();
    if (inserted.error) {
      // Two orders for a new customer at once: the other one won, use theirs.
      if (errorCode(inserted.error) === UNIQUE_VIOLATION) {
        return customerIdByEmail(input.boutiqueId, email);
      }
      throw inserted.error;
    }
    return inserted.data.id as string;
  } catch (error) {
    console.error("[tr/customers] could not link the order to a customer:", error);
    return null;
  }
}
