/** Persist which cart lines should proceed to boutique checkout. */

import { getTrBoutiqueLocalCartStore } from "@/store/trBoutiqueLocalCartStore";
import { cartLineKey } from "@/types/tr-cart";

const keyFor = (boutiqueSlug: string) =>
  `cortis-tr-checkout-selection:${boutiqueSlug.trim().toLowerCase()}`;

export function saveBoutiqueCheckoutSelection(
  boutiqueSlug: string,
  lineKeys: string[],
): void {
  if (typeof window === "undefined") return;
  const slug = boutiqueSlug.trim();
  if (!slug) return;
  try {
    sessionStorage.setItem(keyFor(slug), JSON.stringify(lineKeys));
  } catch {
    // private mode / quota — checkout falls back to full cart
  }
}

export function loadBoutiqueCheckoutSelection(
  boutiqueSlug: string,
): string[] | null {
  if (typeof window === "undefined") return null;
  const slug = boutiqueSlug.trim();
  if (!slug) return null;
  try {
    const raw = sessionStorage.getItem(keyFor(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return null;
  }
}

export function clearBoutiqueCheckoutSelection(boutiqueSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(keyFor(boutiqueSlug.trim()));
  } catch {
    // ignore
  }
}

/** Drop only the lines that went to checkout — leave other cart items. */
export function removeBoutiqueCheckedOutCartLines(boutiqueSlug: string): void {
  if (typeof window === "undefined") return;
  const slug = boutiqueSlug.trim();
  if (!slug) return;
  const store = getTrBoutiqueLocalCartStore(slug);
  const selected = loadBoutiqueCheckoutSelection(slug);
  const items = store.getState().items;
  const keys =
    selected && selected.length > 0
      ? new Set(selected)
      : new Set(items.map((item) => cartLineKey(item)));
  for (const item of items) {
    if (keys.has(cartLineKey(item))) {
      store.getState().removeItem(item.productId, item.size, item.variantId);
    }
  }
  clearBoutiqueCheckoutSelection(slug);
}
