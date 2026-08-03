import { TrBoutiqueEditorialCatalog } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialCatalog";
import { TrBoutiqueEditorialSections } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialSections";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

interface TrBoutiqueEditorialHomeProps {
  boutique: TrBoutiquePublic;
  products: TrProduct[];
}

export function TrBoutiqueEditorialHome({
  boutique,
  products,
}: TrBoutiqueEditorialHomeProps) {
  return (
    <>
      <TrBoutiqueEditorialSections boutique={boutique} />
      <TrBoutiqueEditorialCatalog
        products={products}
        boutiqueSlug={boutique.slug}
        boutiqueName={boutique.name}
      />
    </>
  );
}
