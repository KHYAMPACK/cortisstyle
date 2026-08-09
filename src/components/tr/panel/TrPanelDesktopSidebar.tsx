"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { TrOwnerBoutiqueSummary } from "@/lib/tr/ownerClient";
import { isTrPanelNavActive, TR_PANEL_NAV } from "@/lib/tr/panelNav";
import { trBoutiquePath, trPanelOrdersPath, trPanelPath } from "@/lib/tr/paths";

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
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh w-[240px] shrink-0 flex-col border-r border-[color:var(--panel-accent-border)] bg-white">
      <div className="border-b border-[color:var(--panel-accent-border)] px-4 py-4">
        <Link
          href={trPanelPath()}
          className="text-[13px] font-semibold tracking-wide text-[color:var(--panel-accent-deep)]"
        >
          Butik Paneli
        </Link>
        <div className="mt-3 flex items-center gap-3">
          {activeBoutique.logoUrl ? (
            <Image
              src={activeBoutique.logoUrl}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full bg-[color:var(--panel-accent-soft)] object-contain p-1"
              unoptimized
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--panel-accent-soft)] text-sm font-semibold text-[color:var(--panel-accent-deep)]">
              {activeBoutique.name.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            {boutiques.length > 1 ? (
              <select
                className="w-full rounded-lg border border-[color:var(--panel-accent-border)] bg-white px-2 py-1.5 text-[14px] font-medium text-neutral-900"
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
              <p className="truncate text-[15px] font-semibold text-neutral-900">
                {activeBoutique.name}
              </p>
            )}
          </div>
        </div>
      </div>

      <nav
        aria-label="Panel menüsü"
        className="flex-1 overflow-y-auto px-2 py-3"
      >
        <ul className="space-y-0.5">
          {TR_PANEL_NAV.map((item) => {
            const active = isTrPanelNavActive(pathname, item);
            const showOrderDot =
              item.href === trPanelOrdersPath() && hasNewOrders;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`relative flex items-center rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-colors ${
                    active
                      ? "text-white"
                      : "text-neutral-700 hover:bg-[color:var(--panel-accent-soft)]"
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
                      className="ml-auto h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"
                      aria-hidden
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-2 border-t border-[color:var(--panel-accent-border)] p-3">
        <Link
          href={trBoutiquePath(activeBoutique.slug)}
          className="flex min-h-10 items-center justify-center rounded-lg border border-[color:var(--panel-accent-border)] bg-white px-3 text-[14px] font-semibold text-[color:var(--panel-accent-deep)] hover:bg-[color:var(--panel-accent-soft)]"
        >
          Mağazayı aç
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="flex min-h-10 w-full items-center justify-center rounded-lg px-3 text-[14px] font-semibold text-neutral-600 hover:bg-neutral-100"
        >
          Çıkış
        </button>
      </div>
    </aside>
  );
}
