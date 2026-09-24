"use client";

import { LogOut, PanelLeftClose, PanelLeftOpen, Store } from "lucide-react";
import Link from "next/link";
import { TrPanelBoutiqueLogo } from "@/components/tr/panel/TrPanelBoutiqueLogo";
import { TrPanelNavLinks } from "@/components/tr/panel/TrPanelNavLinks";
import {
  PANEL_SIDEBAR_COLLAPSED_WIDTH,
  PANEL_SIDEBAR_WIDTH,
  panelEaseCss,
  panelSidebarRowClass,
  panelSidebarRowIdleClass,
} from "@/components/tr/panel/panelUi";
import type { TrOwnerBoutiqueSummary } from "@/lib/tr/ownerClient";
import { panelBoutiqueLogoSrc } from "@/lib/tr/panel/panelLogo";
import { trBoutiquePath, trPanelPath } from "@/lib/tr/paths";

interface TrPanelDesktopSidebarProps {
  boutiques: TrOwnerBoutiqueSummary[];
  activeBoutique: TrOwnerBoutiqueSummary;
  setActiveBoutiqueId: (id: string) => void;
  hasNewOrders: boolean;
  onSignOut: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Signed-in account, shown under the footer actions. */
  accountLabel?: string | null;
}

export function TrPanelDesktopSidebar({
  boutiques,
  activeBoutique,
  setActiveBoutiqueId,
  hasNewOrders,
  onSignOut,
  collapsed,
  onToggleCollapsed,
  accountLabel,
}: TrPanelDesktopSidebarProps) {
  const logoSrc = panelBoutiqueLogoSrc(activeBoutique);
  const initial = activeBoutique.name.slice(0, 1).toUpperCase();
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const toggleLabel = collapsed ? "Menüyü genişlet" : "Menüyü daralt";

  const logo = logoSrc ? (
    <TrPanelBoutiqueLogo
      src={logoSrc}
      size={36}
      className="h-9 w-9 rounded-full bg-white object-contain p-0.5"
    />
  ) : (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--panel-accent)] text-[13px] font-semibold">
      {initial}
    </span>
  );

  return (
    <aside
      className="flex h-dvh shrink-0 flex-col overflow-hidden bg-[color:var(--panel-shell,#1C1C1E)] text-white motion-reduce:transition-none"
      style={{
        width: collapsed ? PANEL_SIDEBAR_COLLAPSED_WIDTH : PANEL_SIDEBAR_WIDTH,
        transition: `width 200ms ${panelEaseCss}`,
      }}
      data-collapsed={collapsed}
    >
      <div className="px-3 pt-4 pb-3">
        <div
          className={`flex items-center px-1 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {collapsed ? null : (
            <Link
              href={trPanelPath()}
              className="text-[11px] font-semibold tracking-[0.14em] text-white/45 uppercase transition-colors hover:text-white/70"
            >
              Butik
            </Link>
          )}
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={toggleLabel}
            aria-expanded={!collapsed}
            title={toggleLabel}
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/55 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white/70 motion-reduce:transition-none"
          >
            <ToggleIcon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2.5 pl-1">
          {collapsed ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={`${activeBoutique.name} — ${toggleLabel}`}
              title={activeBoutique.name}
              className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
            >
              {logo}
            </button>
          ) : (
            logo
          )}
          <div
            className={`min-w-0 flex-1 transition-opacity duration-150 motion-reduce:transition-none ${
              collapsed ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
            aria-hidden={collapsed}
          >
            {boutiques.length > 1 ? (
              <select
                className="w-full rounded-md border-0 bg-white/10 px-2 py-1.5 text-[13px] font-medium text-white transition-colors outline-none hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white/70"
                value={activeBoutique.id}
                onChange={(event) => setActiveBoutiqueId(event.target.value)}
                tabIndex={collapsed ? -1 : 0}
              >
                {boutiques.map((boutique) => (
                  <option key={boutique.id} value={boutique.id}>
                    {boutique.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="truncate text-[13.5px] font-semibold">
                {activeBoutique.name}
              </p>
            )}
          </div>
        </div>
      </div>

      <TrPanelNavLinks
        boutiqueId={activeBoutique.id}
        catalogProfile={activeBoutique.catalogProfile ?? "fashion"}
        hasNewOrders={hasNewOrders}
        variant="dark"
        collapsed={collapsed}
      />

      <div className="space-y-0.5 border-t border-white/10 p-2">
        <Link
          href={trBoutiquePath(activeBoutique.slug)}
          className={`${panelSidebarRowClass} ${panelSidebarRowIdleClass}`}
          title={collapsed ? "Mağazayı aç" : undefined}
        >
          <Store className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
          <span className={collapsed ? "opacity-0" : "opacity-100"}>
            Mağazayı aç
          </span>
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className={`${panelSidebarRowClass} ${panelSidebarRowIdleClass}`}
          title={collapsed ? "Çıkış" : undefined}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
          <span className={collapsed ? "opacity-0" : "opacity-100"}>Çıkış</span>
        </button>
        {accountLabel && !collapsed ? (
          <p
            className="truncate px-3 pt-1.5 pb-1 text-[11.5px] text-white/40"
            title={accountLabel}
          >
            {accountLabel}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
