export interface TrCartLineItem {
  productId: string;
  boutiqueId: string;
  boutiqueName: string;
  boutiqueSlug: string;
  title: string;
  priceKurus: number;
  image: string | null;
  size: string | null;
  /** The chosen variant of a product with variants (then `size` is null). */
  variantId?: string | null;
  /** "Kırmızı / S", shown on the line; the order keeps the server's own label. */
  variantLabel?: string | null;
  /** Customer reference photo for custom_art lines. */
  referenceImageUrl?: string | null;
  referenceId?: string | null;
  styleOption?: string | null;
}

type CartLineIdentity = Pick<
  TrCartLineItem,
  "productId" | "size" | "variantId" | "referenceImageUrl" | "styleOption"
>;

/**
 * Stable identity for one cart row: same product + different beden (or variant) =
 * separate lines.
 */
export function cartLineKey(item: CartLineIdentity): string {
  if (item.variantId) return `${item.productId}::v:${item.variantId}`;
  const size = item.size?.trim().toLocaleUpperCase("en") ?? "";
  const ref = item.referenceImageUrl?.trim() ?? "";
  if (!ref) {
    return `${item.productId}::${size}`;
  }
  const style = item.styleOption?.trim() ?? "";
  return `${item.productId}::${size}::${ref}::${style}`;
}

export function sameCartLine(a: CartLineIdentity, b: CartLineIdentity): boolean {
  return cartLineKey(a) === cartLineKey(b);
}

export interface TrCheckoutFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  line1: string;
  line2: string;
  district: string;
  city: string;
  postalCode: string;
  country: string;
  /** Bireysel (default) or kurumsal fatura. */
  invoiceType: "individual" | "corporate";
  buyerTaxId: string;
  buyerTaxOffice: string;
  buyerTitle: string;
}

export const EMPTY_CHECKOUT_FORM: TrCheckoutFormData = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  line1: "",
  line2: "",
  district: "",
  city: "",
  postalCode: "",
  country: "TR",
  invoiceType: "individual",
  buyerTaxId: "",
  buyerTaxOffice: "",
  buyerTitle: "",
};

export function cartTotalKurus(items: TrCartLineItem[]): number {
  return items.reduce((sum, item) => sum + item.priceKurus, 0);
}

export function groupCartItemsByBoutique(
  items: TrCartLineItem[],
): Array<{ boutiqueId: string; boutiqueName: string; boutiqueSlug: string; items: TrCartLineItem[] }> {
  const groups = new Map<
    string,
    { boutiqueId: string; boutiqueName: string; boutiqueSlug: string; items: TrCartLineItem[] }
  >();

  for (const item of items) {
    const existing = groups.get(item.boutiqueId);
    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(item.boutiqueId, {
      boutiqueId: item.boutiqueId,
      boutiqueName: item.boutiqueName,
      boutiqueSlug: item.boutiqueSlug,
      items: [item],
    });
  }

  return Array.from(groups.values());
}
