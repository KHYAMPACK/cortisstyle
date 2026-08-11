import { resolveBoutiqueHomeLayout } from "@/lib/tr/boutiqueHome";
import type { TrBoutiqueHomeLayoutId } from "@/lib/tr/boutiqueHome/types";
import { isTrDemoProduct } from "@/lib/tr/looks/demoCatalog";
import { isTrCheckoutEnabled } from "@/lib/tr/platform";

/** True when product should use Sepete ekle / local checkout (not WhatsApp-only). */
export function isProductCartCheckoutEnabled(product: {
  id?: string;
  boutique: {
    slug: string;
    homeLayout?: TrBoutiqueHomeLayoutId | string | null;
  };
}): boolean {
  if (isTrCheckoutEnabled()) return true;
  if (isTrDemoProduct(product)) return true;
  const layout = product.boutique.homeLayout;
  const normalized =
    layout === "editorial" || layout === "default" ? layout : null;
  return (
    resolveBoutiqueHomeLayout(product.boutique.slug, normalized) === "editorial"
  );
}
