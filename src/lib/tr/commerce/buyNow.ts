import { saveBoutiqueCheckoutSelection } from "@/lib/tr/checkoutSelection";
import { trBoutiqueCheckoutPath } from "@/lib/tr/paths";
import { getTrBoutiqueLocalCartStore } from "@/store/trBoutiqueLocalCartStore";
import { cartLineKey, type TrCartLineItem } from "@/types/tr-cart";

export type TrPurchaseIntent = "add" | "buyNow";

/**
 * Put this line in the boutique cart, checkout only that line, return PDP→ödeme href.
 * Other cart rows stay in the bag; they are not billed on this pass.
 */
export function beginBuyNowCheckout(item: TrCartLineItem): string {
  const store = getTrBoutiqueLocalCartStore(item.boutiqueSlug);
  store.getState().addItem(item);
  saveBoutiqueCheckoutSelection(item.boutiqueSlug, [cartLineKey(item)]);
  return trBoutiqueCheckoutPath(item.boutiqueSlug);
}
