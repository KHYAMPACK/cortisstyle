"use client";

import Link from "next/link";
import { Menu, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TrCartLink } from "@/components/tr/TrCartLink";
import { MinimoraWordmark } from "@/components/tr/boutique/minimora/MinimoraWordmark";
import { minimoraHomeContent } from "@/components/tr/boutique/minimora/minimoraHomeContent";
import {
  trBoutiqueAuthPath,
  trBoutiquePath,
  trBoutiqueProductPath,
  trBoutiqueProductsPath,
} from "@/lib/tr/paths";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

interface TrMinimoraHeaderProps {
  boutique: TrBoutiquePublic;
  products?: TrProduct[];
}

export function TrMinimoraHeader({
  boutique,
  products = [],
}: TrMinimoraHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const homeHref = trBoutiquePath(boutique.slug);
  const orderHref =
    products[0]?.id != null
      ? trBoutiqueProductPath(boutique.slug, products[0].id)
      : trBoutiqueProductsPath(boutique.slug);
  const authHref = trBoutiqueAuthPath(boutique.slug);

  const navLinks = [
    { href: `#${minimoraHomeContent.howItWorks.id}`, label: minimoraHomeContent.nav.how },
    { href: `#${minimoraHomeContent.galleryAnchorId}`, label: minimoraHomeContent.nav.gallery },
  ] as const;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const menu =
    mounted && menuOpen
      ? createPortal(
          <div className="fixed inset-0 z-[200]">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Menüyü kapat"
              onClick={() => setMenuOpen(false)}
            />
            <nav className="absolute top-0 left-0 flex h-full w-[min(100%,360px)] flex-col bg-[#FDFBF7] px-6 py-8 shadow-xl">
              <div className="flex items-center justify-between">
                <MinimoraWordmark />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-11 w-11 items-center justify-center"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ul className="mt-10 space-y-1">
                <li>
                  <Link
                    href={homeHref}
                    onClick={() => setMenuOpen(false)}
                    className="block min-h-12 py-3 text-[15px] font-medium text-[#3D3D3D]"
                  >
                    {minimoraHomeContent.nav.home}
                  </Link>
                </li>
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block min-h-12 py-3 text-[15px] text-[#3D3D3D]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href={orderHref}
                    onClick={() => setMenuOpen(false)}
                    className="block min-h-12 py-3 text-[15px] font-semibold text-[#E08E5C]"
                  >
                    {minimoraHomeContent.nav.order}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#FDFBF7]/95 backdrop-blur-md">
        <div className="relative mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 md:h-16 md:gap-5 md:px-8">
          <div className="flex flex-1 items-center gap-3 md:gap-6">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center"
              aria-label="Menü"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5 text-[#3D3D3D]" strokeWidth={1.75} />
            </button>

            <nav className="hidden items-center gap-6 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[14px] font-medium text-[#3D3D3D] transition-colors hover:text-[#E08E5C]"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={orderHref}
                className="text-[14px] font-semibold text-[#E08E5C]"
              >
                {minimoraHomeContent.nav.order}
              </Link>
            </nav>
          </div>

          <Link
            href={homeHref}
            className="absolute left-1/2 flex -translate-x-1/2 items-center"
            aria-label="Minimora ana sayfa"
          >
            <MinimoraWordmark />
          </Link>

          <div className="flex flex-1 items-center justify-end gap-0.5">
            <Link
              href={authHref}
              className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60 md:h-11 md:w-11"
              aria-label="Hesap"
            >
              <User className="h-5 w-5 text-[#3D3D3D]" strokeWidth={1.5} />
            </Link>
            <TrCartLink size="md" />
          </div>
        </div>
      </header>
      {menu}
    </>
  );
}
