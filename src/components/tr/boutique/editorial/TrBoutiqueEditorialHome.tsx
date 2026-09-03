import { TrBoutiqueEditorialCatalog } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialCatalog";
import { TrBoutiqueEditorialSections } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialSections";
import { TrMinimoraHomePage } from "@/components/tr/boutique/minimora/TrMinimoraHomePage";
import { isAtelierEditorialSkin } from "@/lib/tr/boutiqueHome";
import { isMinimoraBoutique } from "@/lib/tr/boutique/minimora/isMinimoraBoutique";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

interface TrBoutiqueEditorialHomeProps {
  boutique: TrBoutiquePublic;
  products: TrProduct[];
}

export function TrBoutiqueEditorialHome({
  boutique,
  products,
}: TrBoutiqueEditorialHomeProps) {
  if (isMinimoraBoutique(boutique.slug)) {
    return <TrMinimoraHomePage boutique={boutique} products={products} />;
  }

  const atelier = isAtelierEditorialSkin(boutique.slug);

  return (
    <>
      <TrBoutiqueEditorialSections boutique={boutique} products={products} />
      {!atelier ? (
        <TrBoutiqueEditorialCatalog
          products={products}
          boutiqueSlug={boutique.slug}
          boutiqueName={boutique.name}
        />
      ) : null}
    </>
  );
}
