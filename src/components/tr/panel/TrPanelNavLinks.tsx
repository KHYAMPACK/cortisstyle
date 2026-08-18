"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { panelNavIcon } from "@/components/tr/panel/TrPanelNavIcons";
import {
  prefetchOwnerOrders,
  prefetchOwnerProducts,
} from "@/lib/tr/ownerClient";
import { isTrPanelNavActive, TR_PANEL_NAV } from "@/lib/tr/panelNav";
import { trPanelOrdersPath } from "@/lib/tr/paths";

export function TrPanelNavLinks({
  boutiqueId,
  hasNewOrders,
  onNavigate,
  variant,
}: {
  boutiqueId: string;
  hasNewOrders: boolean;
  onNavigate?: () => void;
  variant: "dark" | "bottom";
}) {
  const pathname = usePathname();

  const prefetchNav = (kind: "products" | "orders" | undefined) => {
    if (kind === "products") prefetchOwnerProducts(boutiqueId);
    if (kind === "orders") prefetchOwnerOrders(boutiqueId);
  };

  if (variant === "bottom") {
    const primary = TR_PANEL_NAV.slice(0, 4);
    return (
      <nav
        aria-label="Hızlı menü"
        className="grid grid-cols-4 border-t border-white/10 bg-[#1C1C1E]"
      >
        {primary.map((item) => {
          const active = isTrPanelNavActive(pathname, item);
          const Icon = panelNavIcon(item.href);
          const showOrderDot =
            item.href === trPanelOrdersPath() && hasNewOrders;
          return (
            <Link
              key={item.href}
              href={item.href}
              onPointerEnter={() => prefetchNav(item.prefetch)}
              onFocus={() => prefetchNav(item.prefetch)}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                active ? "text-white" : "text-white/55"
              }`}
              aria-label={
                showOrderDot ? `${item.label} — yeni sipariş var` : item.label
              }
            >
              <Icon
                className="h-[18px] w-[18px]"
                strokeWidth={1.75}
                aria-hidden
              />
              {item.label}
              {showOrderDot ? (
                <span
                  className="absolute top-2 right-[28%] h-1.5 w-1.5 rounded-full bg-rose-500"
                  aria-hidden
                />
              ) : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Panel menüsü" className="flex-1 overflow-y-auto px-2 py-3">
      <ul className="space-y-0.5">
        {TR_PANEL_NAV.map((item) => {
          const active = isTrPanelNavActive(pathname, item);
          const Icon = panelNavIcon(item.href);
          const showOrderDot =
            item.href === trPanelOrdersPath() && hasNewOrders;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                onPointerEnter={() => prefetchNav(item.prefetch)}
                onFocus={() => prefetchNav(item.prefetch)}
                className={`relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
                aria-current={active ? "page" : undefined}
                aria-label={
                  showOrderDot ? `${item.label} — yeni sipariş var` : item.label
                }
              >
                {active ? (
                  <span
                    className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-[color:var(--panel-accent)]"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className="h-[18px] w-[18px] shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                />
                {item.label}
                {showOrderDot ? (
                  <span
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-rose-500"
                    aria-hidden
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
