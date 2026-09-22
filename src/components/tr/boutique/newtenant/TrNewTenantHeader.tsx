"use client";

import Link from "next/link";
import { ChevronDown, Heart, Menu, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { TrCartLink } from "@/components/tr/TrCartLink";
import { useTrScopedFavorites } from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { TrNewTenantNavMegaMenu } from "@/components/tr/boutique/newtenant/TrNewTenantNavMegaMenu";
import { TrNewTenantSearchBox } from "@/components/tr/boutique/newtenant/TrNewTenantSearchBox";
import {
  trBoutiqueAuthPath,
  trBoutiqueFavoritesPath,
  trBoutiquePath,
  trBoutiqueProductsPath,
} from "@/lib/tr/paths";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

/**
 * PopSockets-style standalone header: two thin promo bars, a wordmark
 * row (search / favorites / account / cart), and a separate flat nav
 * row below it — same two-row split as popsockets.com, with a hover
 * mega-menu on the "MagSafe Tutucular" item. Text wordmark stands in
 * for a logo asset until brand assets exist.
 */
interface TrNewTenantHeaderProps {
  boutique: TrBoutiquePublic;
  products?: TrProduct[];
}

export function TrNewTenantHeader({
  boutique,
  products = [],
}: TrNewTenantHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [gripsMenuOpen, setGripsMenuOpen] = useState(false);
  const homeHref = trBoutiquePath(boutique.slug);
  const authHref = trBoutiqueAuthPath(boutique.slug);
  const favoritesHref = trBoutiqueFavoritesPath(boutique.slug);
  const favorites = useTrScopedFavorites();
  const favCount = favorites.hydrated ? favorites.itemCount : 0;

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <div className="bg-[#B8FF3D] px-5 py-2 text-center text-[12px] font-semibold text-[#0A0A0A] md:px-8">
        60 TL üzeri kargo bedava
      </div>
      <Link
        href={trBoutiqueProductsPath(boutique.slug, { kategori: "ozel-tasarim" })}
        className="flex items-center justify-center gap-1 bg-[#0A0A0A] px-5 py-1.5 text-center text-[11px] font-medium text-white hover:opacity-80 md:px-8"
      >
        Kendi tasarımını yükle, tutucunu kişiselleştir
        <ChevronDown className="h-3 w-3" strokeWidth={2} />
      </Link>

      <header className="sticky top-0 z-40 border-b border-[#E5E5E5] bg-white">
        {/* Row A — wordmark + search/favorites/account/cart. Wordmark
            is absolutely centered on the row itself (md+) so the
            right-side cluster's width never has to be mirrored by a
            matching left-side spacer to stay balanced. */}
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20 md:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Menüyü aç"
            className="flex h-10 w-10 items-center justify-center text-[#171717] md:hidden"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>

          <Link
            href={homeHref}
            className="text-[22px] font-bold uppercase tracking-[0.03em] text-[#171717] md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:text-[26px]"
          >
            {boutique.name}
          </Link>

          <div className="flex items-center gap-5 md:ml-auto">
            <TrNewTenantSearchBox
              boutiqueSlug={boutique.slug}
              products={products}
              className="hidden w-[240px] md:block"
            />
            <Link
              href={favoritesHref}
              aria-label={favCount > 0 ? `Favoriler (${favCount})` : "Favoriler"}
              className="relative hidden h-10 w-10 items-center justify-center text-[#171717] transition-opacity hover:opacity-60 md:flex"
            >
              <Heart className="h-5 w-5" strokeWidth={1.75} />
              {favCount > 0 ? (
                <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center bg-[#B8FF3D] px-1 text-[9px] font-bold text-[#0A0A0A]">
                  {favCount}
                </span>
              ) : null}
            </Link>
            <Link
              href={authHref}
              aria-label="Hesabım"
              className="hidden h-10 w-10 items-center justify-center text-[#171717] transition-opacity hover:opacity-60 md:flex"
            >
              <User className="h-5 w-5" strokeWidth={1.75} />
            </Link>
            <TrCartLink size="md" />
          </div>
        </div>

        {/* Row B — flat category nav + mega menu */}
        <div className="hidden border-t border-[#E5E5E5] md:block">
          <div
            className="relative mx-auto max-w-6xl px-5 md:px-8"
            onMouseLeave={() => setGripsMenuOpen(false)}
          >
            <nav className="flex items-center justify-center gap-10 py-3.5">
              <Link
                href={trBoutiqueProductsPath(boutique.slug)}
                className="group relative text-[15px] font-semibold text-[#171717]"
              >
                Tüm Tutucular
                <span className="absolute inset-x-0 -bottom-1 h-[1.5px] origin-left scale-x-0 bg-[#171717] transition-transform duration-200 ease-out group-hover:scale-x-100" />
              </Link>
              <button
                type="button"
                onMouseEnter={() => setGripsMenuOpen(true)}
                onClick={() => setGripsMenuOpen((v) => !v)}
                className="group relative text-[15px] font-semibold text-[#171717]"
              >
                MagSafe Tutucular
                <span
                  className={`absolute inset-x-0 -bottom-1 h-[1.5px] origin-left bg-[#171717] transition-transform duration-200 ease-out ${
                    gripsMenuOpen ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </button>
              <Link
                href={trBoutiqueProductsPath(boutique.slug, { kategori: "ozel-tasarim" })}
                className="group relative text-[15px] font-semibold text-[#171717]"
              >
                Kendi Tasarımını Yap
                <span className="absolute inset-x-0 -bottom-1 h-[1.5px] origin-left scale-x-0 bg-[#171717] transition-transform duration-200 ease-out group-hover:scale-x-100" />
              </Link>
            </nav>

            <TrNewTenantNavMegaMenu
              boutiqueSlug={boutique.slug}
              open={gripsMenuOpen}
            />
          </div>
        </div>

        {menuOpen ? (
          <div className="fixed inset-0 z-50 bg-white md:hidden">
            <div className="flex h-16 items-center justify-between px-5">
              <span className="text-[20px] font-bold uppercase tracking-[0.03em] text-[#171717]">
                {boutique.name}
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Menüyü kapat"
                className="flex h-10 w-10 items-center justify-center text-[#171717]"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="px-5 py-3">
              <TrNewTenantSearchBox
                boutiqueSlug={boutique.slug}
                products={products}
              />
            </div>
            <nav className="flex flex-col gap-1 px-5 py-4">
              <Link
                href={trBoutiqueProductsPath(boutique.slug)}
                onClick={() => setMenuOpen(false)}
                className="border-b border-[#E5E5E5] py-4 text-[15px] font-medium text-[#171717]"
              >
                Tüm Tutucular
              </Link>
              <Link
                href={trBoutiqueProductsPath(boutique.slug, { kategori: "magsafe-tutucu" })}
                onClick={() => setMenuOpen(false)}
                className="border-b border-[#E5E5E5] py-4 text-[15px] font-medium text-[#171717]"
              >
                MagSafe Tutucular
              </Link>
              <Link
                href={trBoutiqueProductsPath(boutique.slug, { kategori: "ozel-tasarim" })}
                onClick={() => setMenuOpen(false)}
                className="border-b border-[#E5E5E5] py-4 text-[15px] font-medium text-[#171717]"
              >
                Kendi Tasarımını Yap
              </Link>
              <Link
                href={favoritesHref}
                onClick={() => setMenuOpen(false)}
                className="border-b border-[#E5E5E5] py-4 text-[15px] font-medium text-[#171717]"
              >
                Favoriler{favCount > 0 ? ` (${favCount})` : ""}
              </Link>
              <Link
                href={authHref}
                onClick={() => setMenuOpen(false)}
                className="border-b border-[#E5E5E5] py-4 text-[15px] font-medium text-[#171717]"
              >
                Hesabım
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      {/* Dims the page behind the open mega menu so it reads as one
          focused panel instead of the hero bleeding through below it. */}
      <div
        onClick={() => setGripsMenuOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 ${
          gripsMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
    </>
  );
}
