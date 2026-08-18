"use client";

import { Menu, Store, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TrPanelBoutiqueLogo } from "@/components/tr/panel/TrPanelBoutiqueLogo";
import { TrPanelNavLinks } from "@/components/tr/panel/TrPanelNavLinks";
import type { TrOwnerBoutiqueSummary } from "@/lib/tr/ownerClient";
import { panelBoutiqueLogoSrc } from "@/lib/tr/panel/panelLogo";
import { trBoutiquePath, trPanelPath } from "@/lib/tr/paths";

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
  const [open, setOpen] = useState(false);
  const logoSrc = activeBoutique ? panelBoutiqueLogoSrc(activeBoutique) : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex min-h-14 items-center gap-3 bg-[color:var(--panel-shell,#1C1C1E)] px-3 text-white">
        {isAuthenticated && activeBoutique ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
            aria-label="Menüyü aç"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        ) : null}
        <Link href={trPanelPath()} className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-white/45 uppercase">
            Butik
          </p>
          <p className="truncate text-[14px] font-semibold">
            {activeBoutique?.name ?? "Yönetim"}
          </p>
        </Link>
        {activeBoutique ? (
          <Link
            href={trBoutiquePath(activeBoutique.slug)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
            aria-label="Mağazayı aç"
          >
            <Store className="h-5 w-5" strokeWidth={1.75} />
          </Link>
        ) : null}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={onSignOut}
            className="hidden min-h-11 rounded-lg px-3 text-[13px] font-medium text-white/70 sm:inline-flex sm:items-center"
          >
            Çıkış
          </button>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex min-h-11 items-center rounded-lg bg-white px-3 text-[13px] font-semibold text-neutral-900"
          >
            Giriş
          </button>
        )}
      </header>

      {open && activeBoutique ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Menüyü kapat"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,280px)] flex-col bg-[color:var(--panel-shell,#1C1C1E)] text-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {logoSrc ? (
                  <TrPanelBoutiqueLogo
                    src={logoSrc}
                    size={36}
                    className="h-9 w-9 rounded-full bg-white object-contain p-0.5"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--panel-accent)] text-[13px] font-semibold">
                    {activeBoutique.name.slice(0, 1)}
                  </span>
                )}
                {boutiques.length > 1 ? (
                  <select
                    className="max-w-[160px] rounded-md border-0 bg-white/10 px-2 py-2 text-[14px] font-medium text-white"
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
                  <p className="truncate text-[14px] font-semibold">
                    {activeBoutique.name}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-white/80"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <TrPanelNavLinks
              boutiqueId={activeBoutique.id}
              hasNewOrders={hasNewOrders}
              onNavigate={() => setOpen(false)}
              variant="dark"
            />
            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className="flex min-h-11 w-full items-center rounded-lg px-3 text-[14px] font-medium text-white/60"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function TrPanelMobileTabBar({
  boutiqueId,
  hasNewOrders,
}: {
  boutiqueId: string;
  hasNewOrders: boolean;
}) {
  return (
    <div className="fixed right-0 bottom-0 left-0 z-30 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <TrPanelNavLinks
        boutiqueId={boutiqueId}
        hasNewOrders={hasNewOrders}
        variant="bottom"
      />
    </div>
  );
}
