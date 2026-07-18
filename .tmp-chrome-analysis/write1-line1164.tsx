"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { TrAccountMenu } from "@/components/tr/TrAccountMenu";
import { TrNavDrawer } from "@/components/tr/TrNavDrawer";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { useTrPersistedHydration } from "@/lib/tr/useTrPersistedHydration";
import { trCartPath, trSearchPath } from "@/lib/tr/paths";
import { selectCartItemCount, useTrCartStore } from "@/store/trCartStore";

const EDGE_LINK =
  "text-[10px] tracking-[0.22em] text-jet-black uppercase transition-opacity hover:opacity-60";

interface TrFloatingChromeProps {
  cartEnabled: boolean;
}

/**
 * Zara-style corner chrome: no header bar, always visible.
 * Menu toggle morphs 2 lines ↔ X; right stack sits under ARA.
 */
export function TrFloatingChrome({ cartEnabled }: TrFloatingChromeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const itemCount = useTrCartStore(selectCartItemCount);
  const hydrated = useTrPersistedHydration(useTrCartStore.persist);
  const displayCount = hydrated ? itemCount : 0;

  return (
    <>
      <TrNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="pointer-events-none fixed inset-0 z-50">
        {/* Top-left: menu ↔ X */}
        <div className="pointer-events-auto absolute top-5 left-5 md:top-8 md:left-8">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            className="relative flex h-10 w-10 items-center justify-start"
          >
            <span
              className={`absolute left-0 block h-px w-5 origin-center bg-jet-black transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                menuOpen ? "translate-y-0 rotate-45" : "-translate-y-[3.5px] rotate-0"
              }`}
            />
            <span
              className={`absolute left-0 block h-px w-5 origin-center bg-jet-black transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                menuOpen ? "translate-y-0 -rotate-45" : "translate-y-[3.5px] rotate-0"
              }`}
            />
          </button>
        </div>

        {/* Top-right: ARA + SEPET / GİRİŞ / YARDIM */}
        <div className="pointer-events-auto absolute top-5 right-5 flex w-[min(9.5rem,28vw)] flex-col items-end gap-3 md:top-8 md:right-8 md:w-40 md:gap-3.5">
          <TrSoftNavLink
            href={trSearchPath()}
            className={`${EDGE_LINK} flex w-full flex-col items-end gap-2`}
          >
            <span>Ara</span>
            <span className="block h-px w-full bg-jet-black" aria-hidden />
          </TrSoftNavLink>

          <div className="flex flex-col items-end gap-3 md:gap-3.5">
            {cartEnabled ? (
              <TrSoftNavLink
                href={trCartPath()}
                className={`${EDGE_LINK} inline-flex items-center gap-1.5`}
                aria-label={
                  displayCount > 0
                    ? `Sepet (${displayCount} ürün)`
                    : "Sepet"
                }
              >
                <span>Sepet</span>
                <span className="relative inline-flex">
                  <ShoppingBag
                    strokeWidth={1.25}
                    className="h-[15px] w-[15px] text-jet-black"
                    aria-hidden
                  />
                  <span className="absolute inset-0 flex items-center justify-center pt-0.5 text-[8px] leading-none font-medium text-jet-black">
                    {displayCount}
                  </span>
                </span>
              </TrSoftNavLink>
            ) : null}

            <TrAccountMenu menuAlign="right" />

            <TrSoftNavLink href="/contact" className={EDGE_LINK}>
              Yardım
            </TrSoftNavLink>
          </div>
        </div>
      </div>
    </>
  );
}
