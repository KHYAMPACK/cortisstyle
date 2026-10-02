import { hasBoutiqueBrand } from "@/lib/tr/boutiqueBrand";
import { resolveBoutiquePdpLayout } from "@/lib/tr/boutiquePdp";
import { TrBoutiquePdpSplit } from "@/components/tr/boutique/pdp/TrBoutiquePdpSplit";
import { TrCustomArtProductPanel } from "@/components/tr/boutique/pdp/TrCustomArtProductPanel";
import type { TrPublicVariants } from "@/lib/tr/variants/storefront";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrBoutiqueProductPageProps {
  product: TrProductWithBoutique;
  colorSiblings?: TrProductWithBoutique[];
  /** The product's variants; `null` = it sells at product level. */
  variants?: TrPublicVariants | null;
  iyzicoCheckout?: boolean;
}

export function TrBoutiqueProductPage({
  product,
  colorSiblings = [],
  variants = null,
  iyzicoCheckout = false,
}: TrBoutiqueProductPageProps) {
  const branded = hasBoutiqueBrand(product.boutique);
  const layout = resolveBoutiquePdpLayout(product.boutique);

  switch (layout) {
    case "custom_art":
      return (
        <TrCustomArtProductPanel
          product={product}
          branded={branded}
        />
      );
    case "split":
    default:
      return (
        <TrBoutiquePdpSplit
          product={product}
          branded={branded}
          colorSiblings={colorSiblings}
          variants={variants}
          iyzicoCheckout={iyzicoCheckout}
        />
      );
  }
}
