"use client";

import { TrPanelBoutiqueLogo } from "@/components/tr/panel/TrPanelBoutiqueLogo";
import { TrPanelNavLinks } from "@/components/tr/panel/TrPanelNavLinks";
import Link from "next/link";
import type { TrOwnerBoutiqueSummary } from "@/lib/tr/ownerClient";
import { panelBoutiqueLogoSrc } from "@/lib/tr/panel/panelLogo";
import { trBoutiquePath, trPanelPath } from "@/lib/tr/paths";

interface TrPanelDesktopSidebarProps {
  boutiques: TrOwnerBoutiqueSummary[];
  activeBoutique: TrOwnerBoutiqueSummary;
  setActiveBoutiqueId: (id: string) => void;
  hasNewOrders: boolean;
  onSignOut: () => void;
}

export function TrPanelDesktopSidebar({
  boutiques,
  activeBoutique,
  setActiveBoutiqueId,
  hasNewOrders,
  onSignOut,
}: TrPanelDesktopSidebarProps) {
  const logoSrc = panelBoutiqueLogoSrc(activeBoutique);
  const initial = activeBoutique.name.slice(0, 1).toUpperCase();

  return (
    <aside className="flex h-dvh w-[232px] shrink-0 flex-col bg-[color:var(--panel-shell,#1C1C1E)] text-white">
      <div className="px-4 py-4">
        <Link
          href={trPanelPath()}
          className="text-[11px] font-semibold tracking-[0.14em] text-white/45 uppercase"
        >
          Butik
        </Link>
        <div className="mt-3 flex items-center gap-2.5">
          {logoSrc ? (
            <TrPanelBoutiqueLogo
              src={logoSrc}
              size={36}
              className="h-9 w-9 rounded-full bg-white object-contain p-0.5"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--panel-accent)] text-[13px] font-semibold">
              {initial}
            </span>
          )}
          <div className="min-w-0 flex-1">
            {boutiques.length > 1 ? (
              <select
                className="w-full rounded-md border-0 bg-white/10 px-2 py-1.5 text-[13px] font-medium text-white outline-none"
                value={activeBoutique.id}
                onChange={(event) => setActiveBoutiqueId(event.target.value)}
              >
                {boutiques.map((boutique) => (
                  <option key={boutique.id} value={boutique.id}>
                    {boutique.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="truncate text-[13.5px] font-semibold">{activeBoutique.name}</p>
            )}
          </div>
        </div>
      </div>

      <TrPanelNavLinks
        boutiqueId={activeBoutique.id}
        hasNewOrders={hasNewOrders}
        variant="dark"
      />

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href={trBoutiquePath(activeBoutique.slug)}
          className="flex min-h-10 items-center rounded-lg px-3 text-[13px] font-medium text-white/70 hover:bg-white/5 hover:text-white"
        >
          Mağazayı aç
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="flex min-h-10 w-full items-center rounded-lg px-3 text-[13px] font-medium text-white/55 hover:bg-white/5 hover:text-white"
        >
          Çıkış
        </button>
        <div className="flex items-center gap-2.5 px-3 pt-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--panel-accent)] text-[11px] font-semibold">
            {initial}
          </span>
          <p className="truncate text-[12px] text-white/50">{activeBoutique.name}</p>
        </div>
      </div>
    </aside>
  );
}
