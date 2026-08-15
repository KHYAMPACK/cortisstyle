/** Optional contact from boutique signup. Phone is format-checked only if provided. */

export type CustomerProfileFields = {
  firstName: string;
  lastName: string;
  phone: string;
};

export function normalizeCustomerPhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidCustomerPhone(raw: string): boolean {
  const digits = normalizeCustomerPhone(raw);
  return digits.length >= 10 && digits.length <= 15;
}

export function sanitizePersonName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, 80);
}

/**
 * Empty form → null (skip). Invalid phone → error.
 * Partial name/phone is allowed.
 */
export function parseCustomerProfileFields(input: {
  firstName: string;
  lastName: string;
  phone: string;
}): CustomerProfileFields | { error: "phone" } | null {
  const firstName = sanitizePersonName(input.firstName);
  const lastName = sanitizePersonName(input.lastName);
  const phoneRaw = input.phone.trim();

  if (!firstName && !lastName && !phoneRaw) {
    return null;
  }

  if (phoneRaw && !isValidCustomerPhone(phoneRaw)) {
    return { error: "phone" };
  }

  return {
    firstName,
    lastName,
    phone: phoneRaw ? normalizeCustomerPhone(phoneRaw) : "",
  };
}

/** Partial update from Hesabım. Empty phone/name clears that field. */
export function normalizeAccountProfilePatch(contact: {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}):
  | {
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
    }
  | { error: "phone" } {
  const next: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  } = {};

  if (contact.firstName !== undefined) {
    next.firstName = sanitizePersonName(contact.firstName ?? "") || null;
  }
  if (contact.lastName !== undefined) {
    next.lastName = sanitizePersonName(contact.lastName ?? "") || null;
  }
  if (contact.phone !== undefined) {
    const raw = (contact.phone ?? "").trim();
    if (raw && !isValidCustomerPhone(raw)) {
      return { error: "phone" };
    }
    next.phone = raw ? normalizeCustomerPhone(raw) : null;
  }

  return next;
}
