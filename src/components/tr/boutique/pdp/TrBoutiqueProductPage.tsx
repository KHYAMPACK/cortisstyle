import { hasBoutiqueBrand } from "@/lib/tr/boutiqueBrand";
import { resolveBoutiquePdpLayout } from "@/lib/tr/boutiquePdp";
import { TrBoutiquePdpSplit } from "@/components/tr/boutique/pdp/TrBoutiquePdpSplit";
import { TrCustomArtProductPanel } from "@/components/tr/boutique/pdp/TrCustomArtProductPanel";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrBoutiqueProductPageProps {
  product: TrProductWithBoutique;
  entry?: "cadde" | "store";
  colorSiblings?: TrProductWithBoutique[];
  iyzicoCheckout?: boolean;
}

export function TrBoutiqueProductPage({
  product,
  entry = "store",
  colorSiblings = [],
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
          entry={entry}
        />
      );
    case "split":
    default:
      return (
        <TrBoutiquePdpSplit
          product={product}
          branded={branded}
          entry={entry}
          colorSiblings={colorSiblings}
          iyzicoCheckout={iyzicoCheckout}
        />
      );
  }
}
