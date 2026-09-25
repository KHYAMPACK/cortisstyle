/**
 * Boutique customers: what a valid customer looks like, and the numbers shown
 * about one. Pure, so the API, the forms and the tests all use the same rules.
 */

import { validateTurkeyShippingAddress } from "@/lib/tr/geo/turkeyAddress";
import {
  boutiqueLineRevenue,
  isActiveOrder,
} from "@/lib/tr/panel/orderRevenue";
import type {
  TrBoutiqueCustomer,
  TrBoutiqueCustomerAddress,
  TrOrderWithItems,
} from "@/types/tr-marketplace";

export const CUSTOMER_LIMITS = {
  nameMin: 2,
  nameMax: 120,
  emailMax: 254,
  noteMax: 2000,
  addressTitleMax: 40,
  maxAddresses: 10,
  phoneDigitsMin: 10,
  phoneMax: 24,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function normalizeCustomerEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** One line of text: control characters gone, whitespace collapsed. */
function tidy(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()
    : "";
}

/** Multi-line text: keeps line breaks, drops other control characters. */
function tidyNote(value: unknown): string {
  return typeof value === "string"
    ? value
        .replace(/\r\n?/g, "\n")
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
        .trim()
    : "";
}

export function newCustomerAddressId(): string {
  return globalThis.crypto.randomUUID();
}

export type AddressResult =
  | { ok: true; value: TrBoutiqueCustomerAddress }
  | { ok: false; error: string };

/** One address as the form sends it, checked with the same rules as checkout. */
export function validateCustomerAddress(raw: unknown): AddressResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Geçersiz adres." };
  }
  const record = raw as Record<string, unknown>;

  const title = tidy(record.title);
  if (!title) return { ok: false, error: "Adres başlığını yazın." };
  if (title.length > CUSTOMER_LIMITS.addressTitleMax) {
    return {
      ok: false,
      error: `Adres başlığı en fazla ${CUSTOMER_LIMITS.addressTitleMax} karakter olabilir.`,
    };
  }

  const name = tidy(record.name);
  if (name.length < CUSTOMER_LIMITS.nameMin) {
    return { ok: false, error: "Alıcının adını ve soyadını yazın." };
  }
  if (name.length > CUSTOMER_LIMITS.nameMax) {
    return { ok: false, error: "Alıcı adı çok uzun." };
  }

  const checked = validateTurkeyShippingAddress({
    line1: tidy(record.line1),
    line2: tidy(record.line2),
    city: tidy(record.city),
    district: tidy(record.district),
    postalCode: tidy(record.postalCode),
    country: "TR",
  });
  if (!checked.ok) return { ok: false, error: checked.error };

  const id =
    typeof record.id === "string" && ID_PATTERN.test(record.id)
      ? record.id
      : newCustomerAddressId();

  return {
    ok: true,
    value: {
      id,
      title,
      name,
      line1: checked.address.line1,
      line2: checked.address.line2 ?? "",
      district: checked.address.district,
      city: checked.address.city,
      postalCode: checked.address.postalCode,
      country: "TR",
      isDefault: record.isDefault === true,
    },
  };
}

/** Exactly one default address (the first marked one, else the first), or none. */
export function withSingleDefault(
  addresses: readonly TrBoutiqueCustomerAddress[],
): TrBoutiqueCustomerAddress[] {
  const defaultIndex = Math.max(
    0,
    addresses.findIndex((address) => address.isDefault),
  );
  return addresses.map((address, index) => ({
    ...address,
    isDefault: index === defaultIndex,
  }));
}

export interface CustomerInput {
  name: string;
  email: string;
  phone: string | null;
  note: string | null;
  addresses: TrBoutiqueCustomerAddress[];
}

export type CustomerInputResult =
  | { ok: true; value: CustomerInput }
  | { ok: false; error: string };

/** A customer as the create / edit form sends it. */
export function validateCustomerInput(raw: unknown): CustomerInputResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Geçersiz müşteri bilgisi." };
  }
  const record = raw as Record<string, unknown>;

  const name = tidy(record.name);
  if (name.length < CUSTOMER_LIMITS.nameMin) {
    return { ok: false, error: "Ad Soyad en az 2 karakter olmalı." };
  }
  if (name.length > CUSTOMER_LIMITS.nameMax) {
    return { ok: false, error: "Ad Soyad çok uzun." };
  }

  const email = normalizeCustomerEmail(
    typeof record.email === "string" ? record.email : "",
  );
  if (!EMAIL_PATTERN.test(email) || email.length > CUSTOMER_LIMITS.emailMax) {
    return { ok: false, error: "Geçerli bir e-posta girin." };
  }

  const phoneText = tidy(record.phone);
  if (phoneText) {
    const digits = phoneText.replace(/\D/g, "");
    if (
      digits.length < CUSTOMER_LIMITS.phoneDigitsMin ||
      phoneText.length > CUSTOMER_LIMITS.phoneMax ||
      !/^[+\d\s()-]+$/.test(phoneText)
    ) {
      return { ok: false, error: "Geçerli bir telefon numarası girin." };
    }
  }

  const note = tidyNote(record.note);
  if (note.length > CUSTOMER_LIMITS.noteMax) {
    return {
      ok: false,
      error: `Not en fazla ${CUSTOMER_LIMITS.noteMax} karakter olabilir.`,
    };
  }

  const rawAddresses = Array.isArray(record.addresses) ? record.addresses : [];
  if (rawAddresses.length > CUSTOMER_LIMITS.maxAddresses) {
    return {
      ok: false,
      error: `En fazla ${CUSTOMER_LIMITS.maxAddresses} adres kaydedilebilir.`,
    };
  }
  const addresses: TrBoutiqueCustomerAddress[] = [];
  for (const [index, entry] of rawAddresses.entries()) {
    const checked = validateCustomerAddress(entry);
    if (!checked.ok) {
      return { ok: false, error: `Adres ${index + 1}: ${checked.error}` };
    }
    addresses.push(checked.value);
  }

  return {
    ok: true,
    value: {
      name,
      email,
      phone: phoneText || null,
      note: note || null,
      addresses: withSingleDefault(addresses),
    },
  };
}

// --- numbers about a customer -------------------------------------------------

export interface CustomerStats {
  /** Orders that count: paid (or test) and not cancelled — same rule as Raporlar. */
  orderCount: number;
  /** What the boutique earned from them: its own lines net of discount, no shipping. */
  spendKurus: number;
  averageOrderKurus: number;
  itemsPerOrder: number;
  lastOrderAt: string | null;
}

const EMPTY_STATS: CustomerStats = {
  orderCount: 0,
  spendKurus: 0,
  averageOrderKurus: 0,
  itemsPerOrder: 0,
  lastOrderAt: null,
};

/**
 * Stats for every customer in one pass. An order belongs to its `customerId`; an
 * order with none (placed before customers existed) falls back to matching e-mail.
 */
export function indexCustomerStats(
  orders: readonly TrOrderWithItems[],
  customers: readonly Pick<TrBoutiqueCustomer, "id" | "email">[],
  boutiqueId: string,
): Map<string, CustomerStats> {
  const idByEmail = new Map(customers.map((c) => [c.email, c.id]));
  const known = new Set(customers.map((c) => c.id));
  const totals = new Map<
    string,
    { count: number; spend: number; items: number; last: string }
  >();

  for (const order of orders) {
    if (!isActiveOrder(order)) continue;
    const id =
      order.customerId && known.has(order.customerId)
        ? order.customerId
        : idByEmail.get(normalizeCustomerEmail(order.customerEmail));
    if (!id) continue;

    const entry = totals.get(id) ?? { count: 0, spend: 0, items: 0, last: "" };
    entry.count += 1;
    entry.spend += boutiqueLineRevenue(order, boutiqueId);
    entry.items += order.items
      .filter((item) => item.boutiqueId === boutiqueId)
      .reduce((sum, item) => sum + item.quantity, 0);
    if (order.createdAt > entry.last) entry.last = order.createdAt;
    totals.set(id, entry);
  }

  const result = new Map<string, CustomerStats>();
  for (const customer of customers) {
    const entry = totals.get(customer.id);
    result.set(
      customer.id,
      entry
        ? {
            orderCount: entry.count,
            spendKurus: entry.spend,
            averageOrderKurus: Math.round(entry.spend / entry.count),
            itemsPerOrder: entry.items / entry.count,
            lastOrderAt: entry.last,
          }
        : EMPTY_STATS,
    );
  }
  return result;
}

/** Every order of this customer — any status — newest first, for their order table. */
export function ordersOfCustomer(
  orders: readonly TrOrderWithItems[],
  customer: Pick<TrBoutiqueCustomer, "id" | "email">,
): TrOrderWithItems[] {
  return orders
    .filter((order) =>
      order.customerId
        ? order.customerId === customer.id
        : normalizeCustomerEmail(order.customerEmail) === customer.email,
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
