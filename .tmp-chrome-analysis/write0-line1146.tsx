"use client";

import { useCallback, useEffect, useState } from "react";
import { TrAccountMenu } from "@/components/tr/TrAccountMenu";
import { TrNavDrawer } from "@/components/tr/TrNavDrawer";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { useTrPersistedHydration } from "@/lib/tr/useTrPersistedHydration";
import { trCartPath, trSearchPath } from "@/lib/tr/paths";
import { selectCartItemCount, useTrCartStore } from "@/store/trCartStore";

const EDGE_LINK =
  "text-[10px] tracking-[0.22em] text-jet-black uppercase transition-colors hover:text-brand-primary";

const IDLE_MS = 2200;

interface TrFloatingChromeProps {
  cartEnabled: boolean;
}

/**
 * Zara-style corner chrome: no header bar.
 * Visible on pointer move / hover; fades when idle.
 */
export function TrFloatingChrome({ cartEnabled }: TrFloatingChromeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const itemCount = useTrCartStore(selectCartItemCount);
  const hydrated = useTrPersistedHydration(useTrCartStore.persist);
  const displayCount = hydrated ? itemCount : 0;

  const bumpChrome = useCallback(() => {
    setChromeVisible(true);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      setChromeVisible(true);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleIdle = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setChromeVisible(false), IDLE_MS);
    };

    const onActivity = () => {
      setChromeVisible(true);
      scheduleIdle();
    };

    scheduleIdle();
    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("touchstart", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [menuOpen]);

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-50"
        aria-hidden={false}
      >
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out"
          style={{ opacity: chromeVisible || menuOpen ? 1 : 0.12 }}
          onMouseEnter={bumpChrome}
        >
          {/* Top-left: menu */}
          <div className="pointer-events-auto absolute top-5 left-5 md:top-8 md:left-8">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Menüyü aç"
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              className="flex h-10 w-10 flex-col items-start justify-center gap-[7px]"
            >
              <span className="block h-px w-5 bg-jet-black" />
              <span className="block h-px w-5 bg-jet-black" />
              <span className="block h-px w-3.5 bg-jet-black" />
            </button>
          </div>

          {/* Top-right: Ara */}
          <div className="pointer-events-auto absolute top-6 right-5 md:top-8 md:right-8">
            <TrSoftNavLink href={trSearchPath()} className={EDGE_LINK}>
              Ara
            </TrSoftNavLink>
            <span
              className="mt-2 block h-px w-full min-w-[3.5rem] bg-jet-black/80"
              aria-hidden
            />
          </div>

          {/* Mid-right: sepet + hesabım */}
          <div className="pointer-events-auto absolute top-1/2 right-5 flex -translate-y-1/2 flex-col items-end gap-5 md:right-8 md:gap-6">
            {cartEnabled ? (
              <TrSoftNavLink
                href={trCartPath()}
                className={EDGE_LINK}
                aria-label={
                  displayCount > 0
                    ? `Sepet (${displayCount} ürün)`
                    : "Sepet"
                }
              >
                Sepet{displayCount > 0 ? ` (${displayCount})` : ""}
              </TrSoftNavLink>
            ) : null}
            <div className="[&_button]:text-[10px] [&_button]:tracking-[0.22em] [&_button]:text-jet-black [&_button]:uppercase [&_button]:hover:text-brand-primary [&_span]:inline">
              <TrAccountMenu />
            </div>
          </div>
        </div>
      </div>

      <TrNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
