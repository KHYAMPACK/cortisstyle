"use client";

import { useEffect } from "react";
import { TrBoutiqueCatalogProvider } from "@/components/tr/boutique/TrBoutiqueCatalogContext";
import { TrBoutiqueCommerceScopeProvider } from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { TrBoutiqueCookieNotice } from "@/components/tr/boutique/TrBoutiqueCookieNotice";
import { TrBoutiqueEditorialCommercePanels } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialCommercePanels";
import { TrBoutiqueEditorialFooter } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialFooter";
import { TrBoutiqueEditorialHeader } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialHeader";
import { TrBoutiqueEditorialHelpFab } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialHelpFab";
import { TrBoutiqueNavPendingProvider, TrBoutiquePendingMain } from "@/components/tr/boutique/editorial/TrBoutiqueNavPending";
import { TrBoutiqueProductsProvider } from "@/components/tr/boutique/TrBoutiqueProductsContext";
import { TrAddedToCartSheet } from "@/components/tr/TrAddedToCartSheet";
import { resolveBoutiqueThemeAccent } from "@/lib/tr/boutiqueBrand";
import { listCategoriesForProducts } from "@/lib/tr/categories";
import { trBoutiqueLegalPath } from "@/lib/tr/paths";
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
  const accent = resolveBoutiqueThemeAccent(boutique);

  // Portaled sheets (size gate, etc.) render outside the shell — sync brand vars on <html>.
  useEffect(() => {
    const root = document.documentElement;
    const prevPrimary = root.style.getPropertyValue("--brand-primary");
    const prevHover = root.style.getPropertyValue("--brand-primary-hover");
    const prevMuted = root.style.getPropertyValue("--brand-primary-muted");

    root.style.setProperty("--brand-primary", accent);
    root.style.setProperty(
      "--brand-primary-hover",
      `color-mix(in srgb, ${accent} 82%, black)`,
    );
    root.style.setProperty(
      "--brand-primary-muted",
      `color-mix(in srgb, ${accent} 12%, transparent)`,
    );

    return () => {
      if (prevPrimary) root.style.setProperty("--brand-primary", prevPrimary);
      else root.style.removeProperty("--brand-primary");
      if (prevHover) root.style.setProperty("--brand-primary-hover", prevHover);
      else root.style.removeProperty("--brand-primary-hover");
      if (prevMuted) root.style.setProperty("--brand-primary-muted", prevMuted);
      else root.style.removeProperty("--brand-primary-muted");
    };
  }, [accent]);

  return (
    <TrBoutiqueCommerceScopeProvider
      boutiqueSlug={boutique.slug}
      boutiqueName={boutique.name}
    >
      <TrBoutiqueProductsProvider boutique={boutique} products={products}>
        <TrBoutiqueCatalogProvider categories={categories}>
          <div
            className="flex min-h-full flex-col bg-white text-neutral-900"
            style={
              {
                "--boutique-accent": accent,
                "--boutique-sale": "#C41E3A",
                "--brand-primary": accent,
                "--brand-primary-hover": `color-mix(in srgb, ${accent} 82%, black)`,
                "--brand-primary-muted": `color-mix(in srgb, ${accent} 12%, transparent)`,
              } as React.CSSProperties
            }
          >
            <TrBoutiqueNavPendingProvider>
              <TrBoutiqueEditorialHeader boutique={boutique} />
              <main className="flex-1">
                <TrBoutiquePendingMain>{children}</TrBoutiquePendingMain>
              </main>
            </TrBoutiqueNavPendingProvider>
            <TrBoutiqueEditorialFooter boutique={boutique} />
            <TrBoutiqueEditorialHelpFab />
            <TrBoutiqueEditorialCommercePanels />
            <TrAddedToCartSheet />
            <TrBoutiqueCookieNotice
              privacyHref={trBoutiqueLegalPath(boutique.slug, "cerez")}
            />
          </div>
        </TrBoutiqueCatalogProvider>
      </TrBoutiqueProductsProvider>
    </TrBoutiqueCommerceScopeProvider>
  );
}
