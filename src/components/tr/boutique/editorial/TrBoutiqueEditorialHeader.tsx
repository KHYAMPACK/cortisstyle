"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, HelpCircle, Menu, Search, Truck, User, X } from "lucide-react";
import { useEffect, useState } from "react";
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
import { instagramProfileUrl } from "@/lib/tr/whatsapp";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrBoutiqueEditorialHeaderProps {
  boutique: TrBoutiquePublic;
}

function NavButton({
  item,
  onSelect,
  className = "",
}: {
  item: EditorialNavItem;
  onSelect: (item: EditorialNavItem) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`text-[13px] tracking-[0.12em] uppercase transition-opacity hover:opacity-60 md:text-[14px] ${className}`}
      style={item.accent === "sale" ? { color: EDITORIAL_SALE_RED } : undefined}
    >
      {item.label}
    </button>
  );
}

export function TrBoutiqueEditorialHeader({
  boutique,
}: TrBoutiqueEditorialHeaderProps) {
  const router = useRouter();
  const commerce = useTrBoutiqueCommerceScope();
  const favorites = useTrScopedFavorites();
  const content = getEditorialContent(boutique);
  const logoUrl = resolveBoutiqueLogoUrl(boutique);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const leftNav = content.nav.slice(0, 3);
  const rightNav = content.nav.slice(3);
  const favCount = favorites.hydrated ? favorites.itemCount : 0;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  const submitSearch = () => {
    const q = query.trim();
    setSearchOpen(false);
    router.push(trBoutiqueProductsPath(boutique.slug, q ? { q } : undefined));
  };

  const iconBtn =
    "inline-flex h-10 w-10 items-center justify-center text-neutral-900 transition-opacity hover:opacity-60 md:h-12 md:w-12";

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur-md">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:px-4 md:h-[5.5rem] md:gap-3 md:px-8 lg:h-24">
        <div className="flex min-w-0 items-center gap-0 md:w-[30%] md:gap-1">
          <button
            type="button"
            className={`${iconBtn} lg:hidden`}
            aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
            ) : (
              <Menu className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
            )}
          </button>

          <button
            type="button"
            className={`${iconBtn} hidden sm:inline-flex`}
            aria-label="Kargo takip"
            title="Kargo takip"
            onClick={() => commerce.openPanel("tracking")}
          >
            <Truck className="h-5 w-5 md:h-[22px] md:w-[22px]" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            className={`${iconBtn} hidden sm:inline-flex`}
            aria-label="Sorun bildir"
            title="Sorun bildir"
            onClick={() => commerce.openPanel("report")}
          >
            <HelpCircle
              className="h-5 w-5 md:h-[22px] md:w-[22px]"
              strokeWidth={1.5}
            />
          </button>

          <nav
            className="ml-2 hidden items-center justify-end gap-5 lg:flex lg:flex-1 lg:gap-7"
            aria-label="Kategoriler sol"
          >
            {leftNav.map((item) => (
              <NavButton key={item.id} item={item} onSelect={selectNav} />
            ))}
          </nav>
        </div>

        <Link
          href={trBoutiquePath(boutique.slug)}
          className="absolute left-1/2 flex max-w-[42%] -translate-x-1/2 flex-col items-center sm:max-w-none"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={boutique.name}
              width={220}
              height={88}
              className="h-9 w-auto object-contain sm:h-11 md:h-16 lg:h-[4.5rem]"
              unoptimized
              priority
            />
          ) : (
            <span className="font-serif text-lg tracking-[0.18em] uppercase md:text-2xl">
              {boutique.name}
            </span>
          )}
        </Link>

        <div className="flex items-center justify-end gap-0.5 md:w-[30%] md:gap-1">
          <nav
            className="mr-2 hidden items-center gap-5 lg:flex lg:gap-7"
            aria-label="Kategoriler sağ"
          >
            {rightNav.map((item) => (
              <NavButton key={item.id} item={item} onSelect={selectNav} />
            ))}
          </nav>

          <button
            type="button"
            className={iconBtn}
            aria-label="Ara"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <Search className="h-5 w-5 md:h-[22px] md:w-[22px]" strokeWidth={1.5} />
          </button>

          <Link
            href={trBoutiqueAuthPath(boutique.slug)}
            className={`${iconBtn} hidden sm:inline-flex`}
            aria-label="Giriş / Hesap"
          >
            <User className="h-5 w-5 md:h-[22px] md:w-[22px]" strokeWidth={1.5} />
          </Link>

          <button
            type="button"
            className={`relative ${iconBtn}`}
            aria-label={
              favCount > 0 ? `Favoriler (${favCount})` : "Favoriler"
            }
            onClick={() => commerce.openPanel("favorites")}
          >
            <Heart className="h-5 w-5 md:h-[22px] md:w-[22px]" strokeWidth={1.5} />
            {favCount > 0 ? (
              <span className="absolute top-0.5 right-0.5 flex h-5 min-w-5 items-center justify-center bg-neutral-900 px-1 text-[10px] text-white">
                {favCount}
              </span>
            ) : null}
          </button>

          <TrCartLink size="lg" />
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-black/5 px-4 py-4 md:px-8">
          <form
            className="mx-auto flex max-w-xl gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Arama"
              autoFocus
              className="min-w-0 flex-1 border border-neutral-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-neutral-900"
            />
            <button
              type="submit"
              className="bg-neutral-900 px-5 py-3 text-[12px] tracking-[0.14em] text-white uppercase"
            >
              Ara
            </button>
          </form>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="border-t border-black/5 bg-white lg:hidden">
          <nav className="flex flex-col px-4 py-2" aria-label="Mobil menü">
            {content.nav.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                onSelect={selectNav}
                className="border-b border-black/5 py-4 text-left text-[15px]"
              />
            ))}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                commerce.openPanel("tracking");
              }}
              className="border-b border-black/5 py-4 text-left text-[14px] tracking-[0.12em] uppercase"
            >
              Kargo takip
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                commerce.openPanel("report");
              }}
              className="border-b border-black/5 py-4 text-left text-[14px] tracking-[0.12em] uppercase"
            >
              Sorun bildir
            </button>
            <Link
              href={trBoutiqueAuthPath(boutique.slug)}
              onClick={() => setMenuOpen(false)}
              className="border-b border-black/5 py-4 text-[14px] tracking-[0.12em] uppercase"
            >
              Giriş / Hesap
            </Link>
            {boutique.instagramHandle ? (
              <a
                href={instagramProfileUrl(boutique.instagramHandle)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-4 text-[14px] tracking-[0.12em] text-neutral-500 uppercase"
              >
                Instagram
              </a>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
