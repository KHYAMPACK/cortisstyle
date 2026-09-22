import { hasBoutiqueBrand } from "@/lib/tr/boutiqueBrand";
import { resolveBoutiquePdpLayout } from "@/lib/tr/boutiquePdp";
import { TrBoutiquePdpSplit } from "@/components/tr/boutique/pdp/TrBoutiquePdpSplit";
import { TrCustomArtProductPanel } from "@/components/tr/boutique/pdp/TrCustomArtProductPanel";
import { TrNewTenantCustomGripPanel } from "@/components/tr/boutique/newtenant/TrNewTenantCustomGripPanel";
import { TrNewTenantGripPanel } from "@/components/tr/boutique/newtenant/TrNewTenantGripPanel";
import { isNewTenantBoutique } from "@/lib/tr/boutique/newtenant/isNewTenantBoutique";
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
      if (isNewTenantBoutique(product.boutique.slug)) {
        return product.features?.customDesign ? (
          <TrNewTenantCustomGripPanel
            product={product}
            branded={branded}
            entry={entry}
          />
        ) : (
          <TrNewTenantGripPanel product={product} entry={entry} />
        );
      }
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
