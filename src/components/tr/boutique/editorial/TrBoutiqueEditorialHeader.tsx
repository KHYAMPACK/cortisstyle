"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu, Search, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  useTrBoutiqueCommerceScope,
  useTrScopedFavorites,
} from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { TrCartLink } from "@/components/tr/TrCartLink";
import {
  EDITORIAL_SALE_RED,
  getEditorialContent,
  type EditorialNavItem,
} from "@/lib/tr/boutiqueHome";
import { resolveBoutiqueLogoUrl } from "@/lib/tr/boutiqueBrand";
import {
  trBoutiqueAuthPath,
  trBoutiquePath,
  trBoutiqueProductsPath,
} from "@/lib/tr/paths";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrBoutiqueEditorialHeaderProps {
  boutique: TrBoutiquePublic;
}

export function TrBoutiqueEditorialHeader({
  boutique,
}: TrBoutiqueEditorialHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const commerce = useTrBoutiqueCommerceScope();
  const favorites = useTrScopedFavorites();
  const content = getEditorialContent(boutique);
  const logoUrl = resolveBoutiqueLogoUrl(boutique);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const favCount = favorites.hydrated ? favorites.itemCount : 0;
  const productsPath = trBoutiqueProductsPath(boutique.slug);
  const onProductsPage = pathname.includes("/urunler");
  const brandTitle =
    boutique.slug === "pervinsoysalbutik" ? "Pervin Soysal" : boutique.name;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const selectNav = (item: EditorialNavItem) => {
    setMenuOpen(false);
    if (item.categoryId === "sale" || item.accent === "sale") {
      router.push(trBoutiqueProductsPath(boutique.slug, { indirim: true }));
      return;
    }
    if (item.id === "new") {
      router.push(trBoutiqueProductsPath(boutique.slug, { sira: "new" }));
      return;
    }
    if (item.categoryId) {
      router.push(
        trBoutiqueProductsPath(boutique.slug, { kategori: item.categoryId }),
      );
      return;
    }
    router.push(trBoutiqueProductsPath(boutique.slug));
  };

  const iconBtn =
    "inline-flex h-10 w-10 shrink-0 items-center justify-center text-neutral-900 transition-opacity hover:opacity-60 md:h-11 md:w-11";

  const menu =
    menuOpen && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[100]">
            <button
              type="button"
              aria-label="Menüyü kapat"
              className="absolute inset-0 hidden bg-black/25 md:block"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-full flex-col bg-white md:w-1/2 md:max-w-xl md:shadow-xl">
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-black/5 px-4 md:h-16">
                <p className="font-serif text-lg tracking-[0.06em]">{brandTitle}</p>
                <button
                  type="button"
                  className={iconBtn}
                  aria-label="Menüyü kapat"
                  onClick={() => setMenuOpen(false)}
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>

              <nav
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2"
                aria-label="Kategoriler"
              >
                <ul>
                  {content.nav.map((item) => (
                    <li key={item.id} className="border-b border-black/5">
                      <button
                        type="button"
                        onClick={() => selectNav(item)}
                        className="block w-full py-5 text-left transition-opacity hover:opacity-70"
                      >
                        <span
                          className="block text-[28px] leading-none font-semibold tracking-[-0.02em] uppercase md:text-[34px]"
                          style={
                            item.accent === "sale"
                              ? { color: EDITORIAL_SALE_RED }
                              : { color: "#111" }
                          }
                        >
                          {item.label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-1 pb-10">
                  <Link
                    href={trBoutiqueAuthPath(boutique.slug)}
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 text-[12px] tracking-[0.14em] text-neutral-600 uppercase"
                  >
                    Giriş / Hesap
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      commerce.openPanel("tracking");
                    }}
                    className="block w-full py-3 text-left text-[12px] tracking-[0.14em] text-neutral-600 uppercase"
                  >
                    Kargo takip
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      commerce.openPanel("report");
                    }}
                    className="block w-full py-3 text-left text-[12px] tracking-[0.14em] text-neutral-600 uppercase"
                  >
                    Sorun bildir
                  </button>
                </div>
              </nav>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur-md">
      <div className="mx-auto grid h-14 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:px-4 md:h-[4.5rem] md:px-8 lg:h-20">
        <button
          type="button"
          className={iconBtn}
          aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Menu className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
        </button>

        <Link
          href={trBoutiquePath(boutique.slug)}
          className="flex items-center justify-center justify-self-center"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={boutique.name}
              width={220}
              height={88}
              className="h-9 w-auto object-contain sm:h-10 md:h-12 lg:h-14"
              unoptimized
              priority
            />
          ) : (
            <span className="font-serif text-lg tracking-[0.18em] uppercase md:text-xl">
              {brandTitle}
            </span>
          )}
        </Link>

        <div className="flex items-center justify-end gap-0.5 md:gap-1">
          {!onProductsPage ? (
            <Link
              href={productsPath}
              className={iconBtn}
              aria-label="Ara — ürünler"
            >
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          ) : null}

          <Link
            href={trBoutiqueAuthPath(boutique.slug)}
            className={iconBtn}
            aria-label="Giriş / Hesap"
          >
            <User className="h-5 w-5" strokeWidth={1.5} />
          </Link>

          <button
            type="button"
            className={`relative ${iconBtn}`}
            aria-label={
              favCount > 0 ? `Favoriler (${favCount})` : "Favoriler"
            }
            onClick={() => commerce.openPanel("favorites")}
          >
            <Heart className="h-5 w-5" strokeWidth={1.5} />
            {favCount > 0 ? (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center bg-brand-primary px-1 text-[9px] text-white">
                {favCount}
              </span>
            ) : null}
          </button>

          <TrCartLink size="lg" />
        </div>
      </div>

      <nav
        aria-label="Kategoriler"
        className="hidden border-t border-black/5 md:block"
      >
        <ul className="mx-auto flex max-w-7xl items-center justify-center gap-6 overflow-x-auto px-4 py-3 lg:gap-8 lg:px-8">
          {content.nav.map((item) => (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => selectNav(item)}
                className="text-[11px] tracking-[0.16em] uppercase transition-opacity hover:opacity-60 lg:text-[12px]"
                style={
                  item.accent === "sale"
                    ? { color: EDITORIAL_SALE_RED }
                    : undefined
                }
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {menu}
    </header>
  );
}
