"use client";

import { Search } from "lucide-react";
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

const ICON_BUTTON =
  "relative inline-flex size-10 items-center justify-center text-jet-black transition-opacity hover:opacity-60";

interface TrFloatingChromeProps {
  cartEnabled: boolean;
}

function isTrSearchPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const path = pathname.replace(/\/$/, "") || "/";
  return path === trSearchPath();
}

/**
 * Zara-style corner chrome: no header bar.
 * Mobile: icon row (profile · search · bag). Desktop: text stack under ARA.
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
        {/* Top-left: menu ↔ X */}
        <div className="pointer-events-auto absolute top-5 left-5 md:top-8 md:left-8">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            className="relative flex h-12 w-12 items-center justify-start"
          >
            <svg
              width="28"
              height="18"
              viewBox="0 0 28 18"
              fill="none"
              aria-hidden
              className="text-jet-black"
            >
              <g
                className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transform: menuOpen
                    ? "rotate(45deg)"
                    : "translateY(-5px)",
                  transformOrigin: "14px 9px",
                }}
              >
                <line
                  x1="0"
                  y1="9"
                  x2="28"
                  y2="9"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
              <g
                className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transform: menuOpen
                    ? "rotate(-45deg)"
                    : "translateY(5px)",
                  transformOrigin: "14px 9px",
                }}
              >
                <line
                  x1="0"
                  y1="9"
                  x2="28"
                  y2="9"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            </svg>
          </button>
        </div>

        {/* Mobile — icon row: profile · search · bag (no Yardım) */}
        <div className="pointer-events-auto absolute top-5 right-3 flex items-center gap-0.5 md:hidden">
          <TrAccountMenu variant="icon" />
          {onSearch ? null : (
            <TrSoftNavLink
              href={trSearchPath()}
              className={ICON_BUTTON}
              aria-label="Ara"
            >
              <Search className="size-[22px] stroke-[1.25]" aria-hidden />
            </TrSoftNavLink>
          )}
          {cartEnabled ? (
            <TrSoftNavLink
              href={trCartPath()}
              className={ICON_BUTTON}
              aria-label={
                displayCount > 0
                  ? `Sepet (${displayCount} ürün)`
                  : "Sepet"
              }
            >
              <TrZaraBagIcon count={displayCount} className="scale-125" />
            </TrSoftNavLink>
          ) : null}
        </div>

        {/* Desktop — text stack under ARA */}
        <div className="pointer-events-auto absolute top-8 right-8 hidden w-40 flex-col items-end md:flex">
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
            className={`flex flex-col items-end gap-3.5 ${
              onSearch ? "" : "mt-11"
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
