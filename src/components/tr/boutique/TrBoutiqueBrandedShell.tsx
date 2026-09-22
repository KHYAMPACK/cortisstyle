"use client";

import { TrBoutiqueAnnouncementBar } from "@/components/tr/boutique/TrBoutiqueAnnouncementBar";
import { TrBoutiqueCatalogProvider } from "@/components/tr/boutique/TrBoutiqueCatalogContext";
import { TrBoutiqueCategoryDrawer } from "@/components/tr/boutique/TrBoutiqueCategoryDrawer";
import { TrBoutiqueFooter } from "@/components/tr/boutique/TrBoutiqueFooter";
import { TrBoutiqueHeader } from "@/components/tr/boutique/TrBoutiqueHeader";
import { TrAddedToCartSheet } from "@/components/tr/TrAddedToCartSheet";
import { listCategoriesForProducts } from "@/lib/tr/fashion/categories";
import {
  hasBoutiqueBrand,
  resolveBoutiqueBackground,
  resolveBoutiqueThemeAccent,
} from "@/lib/tr/boutiqueBrand";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

interface TrBoutiqueBrandedShellProps {
  boutique: TrBoutiquePublic;
  products?: TrProduct[];
  children: React.ReactNode;
}

export function TrBoutiqueBrandedShell({
  boutique,
  products = [],
  children,
}: TrBoutiqueBrandedShellProps) {
  if (!hasBoutiqueBrand(boutique)) {
    return <>{children}</>;
  }

  const accent = resolveBoutiqueThemeAccent(boutique);
  const background = resolveBoutiqueBackground();
  const categories = listCategoriesForProducts(products);

  return (
    <TrBoutiqueCatalogProvider categories={categories}>
      <div
        className="flex min-h-full flex-col text-neutral-900"
        style={
          {
            backgroundColor: background,
            "--boutique-accent": accent,
          } as React.CSSProperties
        }
      >
        <TrBoutiqueAnnouncementBar boutique={boutique} />
        <TrBoutiqueHeader boutique={boutique} />
        <TrBoutiqueCategoryDrawer boutique={boutique} />
        <main className="flex-1">{children}</main>
        <TrBoutiqueFooter boutique={boutique} />
        <TrAddedToCartSheet />
      </div>
    </TrBoutiqueCatalogProvider>
  );
}
