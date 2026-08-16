"use client";

import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { TrAccountMenu } from "@/components/tr/TrAccountMenu";
import { TrNavDrawer } from "@/components/tr/TrNavDrawer";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { TrZaraBagIcon } from "@/components/tr/TrZaraBagIcon";
import {
  CADDE_HERO_RIP_DONE_EVENT,
  hasCaddeHeroRipSettled,
  isCaddeHomePath,
} from "@/lib/introLoader";
import { useTrPersistedHydration } from "@/lib/tr/useTrPersistedHydration";
import { trCartPath, trHomePath, trSearchPath } from "@/lib/tr/paths";
import { CADDE_TRANSITION_WORD } from "@/lib/platform/caddeTransition";
import { selectCartItemCount, useTrCartStore } from "@/store/trCartStore";

const EDGE_LINK =
  "font-cadde-nav text-[11px] font-semibold tracking-[0.2em] text-white uppercase transition-opacity hover:opacity-60";

const LOGO_SHRINK_PX = 380;
const LOGO_SCALE_HERO = 1;
const LOGO_SCALE_SCROLLED = 0.68;

const ICON_BUTTON =
  "relative inline-flex size-10 items-center justify-center text-white transition-opacity hover:opacity-60";

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
  const onCaddeHome = isCaddeHomePath(pathname ?? "");
  const reduceMotion = useReducedMotion();
  const onSearch = isTrSearchPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chromeReady, setChromeReady] = useState(
    () => !onCaddeHome || hasCaddeHeroRipSettled(),
  );
  const itemCount = useTrCartStore(selectCartItemCount);
  const hydrated = useTrPersistedHydration(useTrCartStore.persist);
  const displayCount = hydrated ? itemCount : 0;
  const [wide, setWide] = useState(false);
  const { scrollY } = useScroll();
  const logoScaleRaw = useTransform(
    scrollY,
    [0, LOGO_SHRINK_PX],
    [LOGO_SCALE_HERO, LOGO_SCALE_SCROLLED],
  );
  const logoScaleSpring = useSpring(logoScaleRaw, {
    stiffness: 140,
    damping: 28,
    mass: 0.35,
  });
  const logoScale = !wide
    ? 1
    : !onCaddeHome
      ? LOGO_SCALE_SCROLLED
      : reduceMotion
        ? LOGO_SCALE_HERO
        : logoScaleSpring;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setWide(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!onCaddeHome) {
      setChromeReady(true);
      return;
    }
    if (hasCaddeHeroRipSettled()) {
      setChromeReady(true);
      return;
    }
    setChromeReady(false);
    const onDone = () => setChromeReady(true);
    window.addEventListener(CADDE_HERO_RIP_DONE_EVENT, onDone);
    return () => window.removeEventListener(CADDE_HERO_RIP_DONE_EVENT, onDone);
  }, [onCaddeHome]);

  return (
    <>
      <TrNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      <motion.div
        className="pointer-events-none fixed inset-0 z-[110] mix-blend-difference"
        initial={false}
        animate={{ opacity: chromeReady ? 1 : 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.45,
          ease: [0.22, 1, 0.36, 1],
        }}
        aria-hidden={!chromeReady}
        style={{
          visibility: chromeReady ? "visible" : "hidden",
        }}
      >
        {/* Top-left: menu ↔ X */}
        <div className="pointer-events-auto absolute top-5 left-5 md:top-8 md:left-8">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            className="relative flex h-12 w-12 items-center justify-start text-white"
          >
            <svg
              width="28"
              height="18"
              viewBox="0 0 28 18"
              fill="none"
              aria-hidden
              className="text-current"
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

        <div className="pointer-events-auto absolute top-6 left-1/2 z-10 max-w-[calc(100%-9.5rem)] -translate-x-1/2 md:top-8 md:max-w-none">
          <TrSoftNavLink
            href={trHomePath()}
            aria-label="Cortisstyle ana sayfa"
            className="font-cadde-nav flex min-h-11 items-center justify-center px-1 text-center text-[13px] font-semibold leading-none tracking-[0.16em] text-white uppercase md:font-cadde-display md:text-[2.15rem] md:font-normal md:tracking-[0.1em]"
          >
            <motion.span
              className="inline-block origin-top"
              style={{ scale: logoScale }}
            >
              {CADDE_TRANSITION_WORD}
            </motion.span>
          </TrSoftNavLink>
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
              <span className="block h-px w-full bg-current" aria-hidden />
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
      </motion.div>
    </>
  );
}
