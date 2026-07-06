export interface TrCartLineItem {
  productId: string;
  boutiqueId: string;
  boutiqueName: string;
  boutiqueSlug: string;
  title: string;
  priceKurus: number;
  image: string | null;
  size: string | null;
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
