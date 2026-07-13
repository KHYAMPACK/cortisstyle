import { hasBoutiqueBrand } from "@/lib/tr/boutiqueBrand";
import { resolveBoutiquePdpLayout } from "@/lib/tr/boutiquePdp";
import { TrBoutiquePdpSplit } from "@/components/tr/boutique/pdp/TrBoutiquePdpSplit";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrBoutiqueProductPageProps {
  product: TrProductWithBoutique;
  entry?: "cadde" | "store";
}

export function TrBoutiqueProductPage({
  product,
  entry = "store",
}: TrBoutiqueProductPageProps) {
  const branded = hasBoutiqueBrand(product.boutique);
  const layout = resolveBoutiquePdpLayout(product.boutique.slug);

  switch (layout) {
    case "split":
    default:
      return (
        <TrBoutiquePdpSplit
          product={product}
          branded={branded}
          entry={entry}
        />
      );
  }
}
