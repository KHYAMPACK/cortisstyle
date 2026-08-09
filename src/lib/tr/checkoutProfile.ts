import type { TrCheckoutFormData } from "@/types/tr-cart";

const storageKey = (scope: string) =>
  `cortis-tr-checkout-profile:${scope.trim().toLowerCase() || "marketplace"}`;

/** Persist contact/address only — never store TCKN/VKN in localStorage. */
function profileForStorage(form: TrCheckoutFormData): Partial<TrCheckoutFormData> {
  return {
    customerName: form.customerName,
    customerEmail: form.customerEmail,
    customerPhone: form.customerPhone,
    line1: form.line1,
    line2: form.line2,
    district: form.district,
    city: form.city,
    postalCode: form.postalCode,
    country: form.country,
    invoiceType: form.invoiceType === "corporate" ? "corporate" : "individual",
  };
}

export function loadSavedCheckoutProfile(
  scope: string,
): TrCheckoutFormData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TrCheckoutFormData>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      customerName: String(parsed.customerName ?? ""),
      customerEmail: String(parsed.customerEmail ?? ""),
      customerPhone: String(parsed.customerPhone ?? ""),
      line1: String(parsed.line1 ?? ""),
      line2: String(parsed.line2 ?? ""),
      district: String(parsed.district ?? ""),
      city: String(parsed.city ?? ""),
      postalCode: String(parsed.postalCode ?? ""),
      country: String(parsed.country ?? "TR") || "TR",
      invoiceType:
        parsed.invoiceType === "corporate" ? "corporate" : "individual",
      buyerTaxId: "",
      buyerTaxOffice: String(parsed.buyerTaxOffice ?? ""),
      buyerTitle: String(parsed.buyerTitle ?? ""),
    };
  } catch {
    return null;
  }
}

export function saveCheckoutProfile(
  scope: string,
  form: TrCheckoutFormData,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey(scope),
      JSON.stringify(profileForStorage(form)),
    );
  } catch {
    // Ignore quota / private mode
  }
}

export function clearSavedCheckoutProfile(scope: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(scope));
  } catch {
    // ignore
  }
}
