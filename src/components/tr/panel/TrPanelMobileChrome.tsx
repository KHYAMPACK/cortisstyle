"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { TrOwnerBoutiqueSummary } from "@/lib/tr/ownerClient";
import { isTrPanelNavActive, TR_PANEL_NAV } from "@/lib/tr/panelNav";
import { trBoutiquePath, trPanelOrdersPath, trPanelPath } from "@/lib/tr/paths";

interface TrPanelMobileChromeProps {
  boutiques: TrOwnerBoutiqueSummary[];
  activeBoutique: TrOwnerBoutiqueSummary | undefined;
  setActiveBoutiqueId: (id: string) => void;
  hasNewOrders: boolean;
  isAuthenticated: boolean;
  onSignOut: () => void;
  onSignIn: () => void;
}

export function TrPanelMobileChrome({
  boutiques,
  activeBoutique,
  setActiveBoutiqueId,
  hasNewOrders,
  isAuthenticated,
  onSignOut,
  onSignIn,
}: TrPanelMobileChromeProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      el.scrollLeft += event.deltaY;
      event.preventDefault();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isAuthenticated, activeBoutique?.id]);

  return (
    <header className="mb-6 overflow-hidden rounded-2xl border border-[color:var(--panel-accent-border)] bg-white shadow-sm">
      <div
        className="px-5 py-4 text-white sm:px-6"
        style={{
          background: `linear-gradient(90deg, var(--panel-accent-deep), var(--panel-accent))`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={trPanelPath()}
              className="text-[15px] font-semibold tracking-wide"
            >
              Butik Paneli
            </Link>
            {activeBoutique ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {activeBoutique.logoUrl ? (
                  <Image
                    src={activeBoutique.logoUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full bg-white/95 object-contain p-1"
                    unoptimized
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-semibold">
                    {activeBoutique.name.slice(0, 1)}
                  </span>
                )}
                {boutiques.length > 1 ? (
                  <select
                    className="max-w-full rounded-xl border-0 bg-white px-4 py-3 text-[17px] font-medium text-neutral-900"
                    value={activeBoutique.id}
                    onChange={(event) =>
                      setActiveBoutiqueId(event.target.value)
                    }
                  >
                    {boutiques.map((boutique) => (
                      <option key={boutique.id} value={boutique.id}>
                        {boutique.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="truncate text-[20px] font-semibold leading-tight">
                    {activeBoutique.name}
                  </p>
                )}
              </div>
            ) : (
              <h1 className="mt-1 text-[22px] font-semibold">Yönetim</h1>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeBoutique ? (
              <Link
                href={trBoutiquePath(activeBoutique.slug)}
                className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 text-[16px] font-semibold shadow-sm"
                style={{ color: "var(--panel-accent)" }}
              >
                Mağazayı aç
              </Link>
            ) : null}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex min-h-12 items-center rounded-xl border-2 border-white/70 bg-transparent px-5 py-3 text-[16px] font-semibold text-white"
              >
                Çıkış
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 text-[16px] font-semibold"
                style={{ color: "var(--panel-accent)" }}
              >
                Giriş yap
              </button>
            )}
          </div>
        </div>
      </div>

      {isAuthenticated && activeBoutique ? (
        <nav
          ref={navRef}
          aria-label="Panel menüsü"
          className="flex gap-2 overflow-x-auto overscroll-x-contain p-3 pb-2 [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[color:var(--panel-accent-border)] [&::-webkit-scrollbar-track]:bg-transparent"
          style={{ backgroundColor: "var(--panel-accent-softer)" }}
        >
          {TR_PANEL_NAV.map((item) => {
            const active = isTrPanelNavActive(pathname, item);
            const showOrderDot =
              item.href === trPanelOrdersPath() && hasNewOrders;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative shrink-0 rounded-full px-4 py-3 text-[15px] font-semibold transition-colors ${
                  active
                    ? "text-white shadow-sm"
                    : "bg-white text-neutral-700 ring-1 ring-[color:var(--panel-accent-border)] hover:bg-[color:var(--panel-accent-soft)]"
                }`}
                style={
                  active
                    ? { backgroundColor: "var(--panel-accent)" }
                    : undefined
                }
                aria-label={
                  showOrderDot
                    ? `${item.label} — yeni sipariş var`
                    : item.label
                }
              >
                {item.label}
                {showOrderDot ? (
                  <span
                    className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
