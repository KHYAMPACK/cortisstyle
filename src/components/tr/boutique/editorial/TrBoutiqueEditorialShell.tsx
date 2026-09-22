"use client";

import { useEffect } from "react";
import { TrBoutiqueCatalogProvider } from "@/components/tr/boutique/TrBoutiqueCatalogContext";
import { TrBoutiqueCommerceScopeProvider } from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { TrBoutiqueCookieNotice } from "@/components/tr/boutique/TrBoutiqueCookieNotice";
import { TrBoutiqueEditorialCommercePanels } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialCommercePanels";
import { TrBoutiqueEditorialFooter } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialFooter";
import { TrBoutiqueEditorialHeader } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialHeader";
import { TrMinimoraFooter } from "@/components/tr/boutique/minimora/TrMinimoraFooter";
import { TrMinimoraHeader } from "@/components/tr/boutique/minimora/TrMinimoraHeader";
import { TrNewTenantFooter } from "@/components/tr/boutique/newtenant/TrNewTenantFooter";
import { TrNewTenantHeader } from "@/components/tr/boutique/newtenant/TrNewTenantHeader";
import {
  minimoraBodyFont,
  minimoraDisplayFont,
} from "@/components/tr/boutique/minimora/minimoraFonts";
import {
  newtenantBodyFont,
  newtenantDisplayFont,
} from "@/components/tr/boutique/newtenant/newtenantFonts";
import { TrBoutiqueEditorialHelpFab } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialHelpFab";
import {
  TrBoutiqueNavPendingProvider,
  TrBoutiquePendingMain,
} from "@/components/tr/boutique/editorial/TrBoutiqueNavPending";
import { TrBoutiqueProductsProvider } from "@/components/tr/boutique/TrBoutiqueProductsContext";
import { TrAddedToCartSheet } from "@/components/tr/TrAddedToCartSheet";
import { resolveBoutiqueThemeAccent } from "@/lib/tr/boutiqueBrand";
import { resolveEditorialSkin } from "@/lib/tr/boutiqueHome";
import { isMinimoraBoutique } from "@/lib/tr/boutique/minimora/isMinimoraBoutique";
import { isNewTenantBoutique } from "@/lib/tr/boutique/newtenant/isNewTenantBoutique";
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
  const skin = resolveEditorialSkin(boutique.slug);
  const minimora = isMinimoraBoutique(boutique.slug);
  const newTenant = isNewTenantBoutique(boutique.slug);

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
            data-editorial-skin={skin}
            data-boutique={
              minimora ? "minimora" : newTenant ? "newtenant" : undefined
            }
            className={`flex min-h-full w-full min-w-0 max-w-full flex-col overflow-x-clip text-neutral-900 ${
              minimora
                ? `${minimoraBodyFont.variable} ${minimoraDisplayFont.variable} ${minimoraBodyFont.className} bg-[#FDFBF7]`
                : newTenant
                  ? `${newtenantBodyFont.variable} ${newtenantDisplayFont.variable} ${newtenantBodyFont.className} bg-[#FAFAFA]`
                  : skin === "atelier"
                    ? "bg-[#FAFAF8]"
                    : "bg-white"
            }`}
            style={
              {
                "--boutique-accent": accent,
                "--boutique-sale":
                  skin === "atelier" ? accent : "#C41E3A",
                "--brand-primary": accent,
                "--brand-primary-hover": `color-mix(in srgb, ${accent} 82%, black)`,
                "--brand-primary-muted": `color-mix(in srgb, ${accent} 12%, transparent)`,
              } as React.CSSProperties
            }
          >
            <TrBoutiqueNavPendingProvider>
              {minimora ? (
                <TrMinimoraHeader boutique={boutique} products={products} />
              ) : newTenant ? (
                <TrNewTenantHeader boutique={boutique} products={products} />
              ) : (
                <TrBoutiqueEditorialHeader boutique={boutique} />
              )}
              <main className="min-w-0 flex-1 overflow-x-clip">
                <TrBoutiquePendingMain>{children}</TrBoutiquePendingMain>
              </main>
            </TrBoutiqueNavPendingProvider>
            {minimora ? (
              <TrMinimoraFooter boutique={boutique} />
            ) : newTenant ? (
              <TrNewTenantFooter boutique={boutique} />
            ) : (
              <TrBoutiqueEditorialFooter boutique={boutique} />
            )}
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
