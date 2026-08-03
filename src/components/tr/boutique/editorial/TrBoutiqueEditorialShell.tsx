"use client";

import { TrBoutiqueCatalogProvider } from "@/components/tr/boutique/TrBoutiqueCatalogContext";
import { TrBoutiqueCommerceScopeProvider } from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { TrBoutiqueEditorialCommercePanels } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialCommercePanels";
import { TrBoutiqueEditorialFooter } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialFooter";
import { TrBoutiqueEditorialHeader } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialHeader";
import { TrBoutiqueEditorialHelpFab } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialHelpFab";
import { TrAddedToCartSheet } from "@/components/tr/TrAddedToCartSheet";
import { listCategoriesForProducts } from "@/lib/tr/categories";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

interface TrBoutiqueEditorialShellProps {
  boutique: TrBoutiquePublic;
  products?: TrProduct[];
  children: React.ReactNode;
}

export function TrBoutiqueEditorialShell({
  boutique,
  products = [],
  children,
}: TrBoutiqueEditorialShellProps) {
  const categories = listCategoriesForProducts(products);

  return (
    <TrBoutiqueCommerceScopeProvider
      boutiqueSlug={boutique.slug}
      boutiqueName={boutique.name}
    >
      <TrBoutiqueCatalogProvider categories={categories}>
        <div
          className="flex min-h-full flex-col bg-white text-neutral-900"
          style={
            {
              "--boutique-accent": boutique.themeAccent?.trim() || "#111111",
              "--boutique-sale": "#C41E3A",
            } as React.CSSProperties
          }
        >
          <TrBoutiqueEditorialHeader boutique={boutique} />
          <main className="flex-1">{children}</main>
          <TrBoutiqueEditorialFooter boutique={boutique} />
          <TrBoutiqueEditorialHelpFab />
          <TrBoutiqueEditorialCommercePanels />
          <TrAddedToCartSheet />
        </div>
      </TrBoutiqueCatalogProvider>
    </TrBoutiqueCommerceScopeProvider>
  );
}
