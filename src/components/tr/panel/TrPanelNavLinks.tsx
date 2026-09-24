"use client";

import { LayoutGroup, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { panelNavIcon } from "@/components/tr/panel/TrPanelNavIcons";
import {
  panelSidebarRowClass,
  panelSidebarRowIdleClass,
} from "@/components/tr/panel/panelUi";
import {
  prefetchOwnerOrders,
  prefetchOwnerProducts,
} from "@/lib/tr/ownerClient";
import {
  isTrPanelNavActive,
  panelNavForProfile,
  type TrCatalogProfileId,
} from "@/lib/tr/panelNav";
import { trPanelOrdersPath } from "@/lib/tr/paths";

/** The pill follows the click, so it should settle fast without bouncing. */
const PILL_SPRING = { type: "spring", stiffness: 520, damping: 42 } as const;

export function TrPanelNavLinks({
  boutiqueId,
  catalogProfile = "fashion",
  hasNewOrders,
  onNavigate,
  variant,
  collapsed = false,
}: {
  boutiqueId: string;
  catalogProfile?: TrCatalogProfileId;
  hasNewOrders: boolean;
  onNavigate?: () => void;
  variant: "dark" | "bottom";
  /** Icon-only rail (desktop sidebar). */
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const groupId = useId();
  const navItems = panelNavForProfile(catalogProfile);

  // Optimistic active state: the pill moves on click, before the route commits.
  // It is tied to the path it was clicked from, so it stops applying on its own
  // once the real path changes — and a click the leave guard blocks never
  // reaches this handler at all (the guard stops it in the capture phase).
  const [pending, setPending] = useState<{ href: string; from: string } | null>(
    null,
  );
  const currentPath = pending && pending.from === pathname ? pending.href : pathname;

  const prefetchNav = (kind: "products" | "orders" | undefined) => {
    if (kind === "products") prefetchOwnerProducts(boutiqueId);
    if (kind === "orders") prefetchOwnerOrders(boutiqueId);
  };

  const select = (href: string) => {
    setPending({ href, from: pathname });
    onNavigate?.();
  };

  if (variant === "bottom") {
    const primary = navItems.slice(0, 4);
    return (
      <nav
        aria-label="Hızlı menü"
        className="grid grid-cols-4 border-t border-white/10 bg-[color:var(--panel-shell,#1C1C1E)]"
      >
        <LayoutGroup id={`${groupId}-bottom`}>
          {primary.map((item) => {
            const active = isTrPanelNavActive(currentPath, item);
            const Icon = panelNavIcon(item.href);
            const showOrderDot =
              item.href === trPanelOrdersPath() && hasNewOrders;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => select(item.href)}
                onPointerEnter={() => prefetchNav(item.prefetch)}
                onFocus={() => prefetchNav(item.prefetch)}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-150 active:bg-white/5 motion-reduce:transition-none ${
                  active ? "text-white" : "text-white/55"
                }`}
                aria-current={active ? "page" : undefined}
                aria-label={
                  showOrderDot ? `${item.label} — yeni sipariş var` : item.label
                }
              >
                {active ? (
                  <motion.span
                    layoutId="panel-tab-indicator"
                    transition={PILL_SPRING}
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-[color:var(--panel-accent)]"
                    aria-hidden
                  />
                ) : null}
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
        </LayoutGroup>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Panel menüsü"
      className="flex-1 overflow-x-hidden overflow-y-auto px-2 py-3"
    >
      <LayoutGroup id={`${groupId}-side`}>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isTrPanelNavActive(currentPath, item);
            const Icon = panelNavIcon(item.href);
            const showOrderDot =
              item.href === trPanelOrdersPath() && hasNewOrders;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch
                  onClick={() => select(item.href)}
                  onPointerEnter={() => prefetchNav(item.prefetch)}
                  onFocus={() => prefetchNav(item.prefetch)}
                  className={`${panelSidebarRowClass} ${
                    active ? "text-white" : panelSidebarRowIdleClass
                  }`}
                  aria-current={active ? "page" : undefined}
                  aria-label={
                    showOrderDot
                      ? `${item.label} — yeni sipariş var`
                      : item.label
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {active ? (
                    <>
                      <motion.span
                        layoutId="panel-nav-pill"
                        transition={PILL_SPRING}
                        className="absolute inset-0 rounded-lg bg-white/10"
                        aria-hidden
                      />
                      <motion.span
                        layoutId="panel-nav-bar"
                        transition={PILL_SPRING}
                        className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-[color:var(--panel-accent)]"
                        aria-hidden
                      />
                    </>
                  ) : null}
                  <Icon
                    className="relative h-[18px] w-[18px] shrink-0"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <span
                    className={`relative min-w-0 truncate transition-opacity duration-150 motion-reduce:transition-none ${
                      collapsed ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    {item.label}
                  </span>
                  {showOrderDot ? (
                    <span
                      className={`h-1.5 w-1.5 rounded-full bg-rose-500 ${
                        collapsed
                          ? "absolute top-2.5 left-[27px]"
                          : "relative ml-auto"
                      }`}
                      aria-hidden
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </LayoutGroup>
    </nav>
  );
}
