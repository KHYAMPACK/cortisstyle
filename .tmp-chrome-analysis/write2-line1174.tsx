"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { TrAccountMenu } from "@/components/tr/TrAccountMenu";
import { TrNavDrawer } from "@/components/tr/TrNavDrawer";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { TrZaraBagIcon } from "@/components/tr/TrZaraBagIcon";
import { useTrPersistedHydration } from "@/lib/tr/useTrPersistedHydration";
import { trCartPath, trSearchPath } from "@/lib/tr/paths";
import { selectCartItemCount, useTrCartStore } from "@/store/trCartStore";

const EDGE_LINK =
  "text-[10px] tracking-[0.22em] text-jet-black uppercase transition-opacity hover:opacity-60";

interface TrFloatingChromeProps {
  cartEnabled: boolean;
}

function isTrSearchPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const path = pathname.replace(/\/$/, "") || "/";
  return path === trSearchPath();
}

/**
 * Zara-style corner chrome: no header bar, always visible on marketplace routes.
 * Menu toggle morphs 2 lines ↔ X; right stack sits under ARA.
 */
export function TrFloatingChrome({ cartEnabled }: TrFloatingChromeProps) {
  const pathname = usePathname();
  const onSearch = isTrSearchPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const itemCount = useTrCartStore(selectCartItemCount);
  const hydrated = useTrPersistedHydration(useTrCartStore.persist);
  const displayCount = hydrated ? itemCount : 0;

  return (
    <>
      <TrNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="pointer-events-none fixed inset-0 z-[110]">
        {/* Top-left: menu ↔ X — hairline stroke, same weight open/closed */}
        <div className="pointer-events-auto absolute top-5 left-5 md:top-8 md:left-8">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            className="relative flex h-10 w-10 items-center justify-start"
          >
            <svg
              width="20"
              height="14"
              viewBox="0 0 20 14"
              fill="none"
              aria-hidden
              className="overflow-visible text-jet-black"
            >
              <line
                x1="0"
                y1="7"
                x2="20"
                y2="7"
                stroke="currentColor"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                className="origin-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transform: menuOpen
                    ? "rotate(45deg)"
                    : "translateY(-4px) rotate(0deg)",
                  transformOrigin: "10px 7px",
                }}
              />
              <line
                x1="0"
                y1="7"
                x2="20"
                y2="7"
                stroke="currentColor"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                className="origin-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transform: menuOpen
                    ? "rotate(-45deg)"
                    : "translateY(4px) rotate(0deg)",
                  transformOrigin: "10px 7px",
                }}
              />
            </svg>
          </button>
        </div>

        {/* Top-right: ARA + SEPET / GİRİŞ / YARDIM */}
        <div className="pointer-events-auto absolute top-5 right-5 flex w-[min(9.5rem,28vw)] flex-col items-end md:top-8 md:right-8 md:w-40">
          {onSearch ? null : (
            <TrSoftNavLink
              href={trSearchPath()}
              className={`${EDGE_LINK} flex w-full flex-col items-end gap-2`}
            >
              <span>Ara</span>
              <span className="block h-px w-full bg-jet-black" aria-hidden />
            </TrSoftNavLink>
          )}

          <div
            className={`flex flex-col items-end gap-3 md:gap-3.5 ${
              onSearch ? "" : "mt-6 md:mt-7"
            }`}
          >
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
                <TrZaraBagIcon count={displayCount} />
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
