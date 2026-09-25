"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PanelNavGroupIcon } from "@/components/tr/panel/TrPanelNavIcons";
import { trPanelOrdersPath } from "@/lib/tr/paths";
import {
  panelEaseCss,
  panelSidebarChildRowClass,
  panelSidebarRowClass,
  panelSidebarRowIdleClass,
} from "@/components/tr/panel/panelUi";
import {
  isTrPanelNavActive,
  isTrPanelNavGroupActive,
  type TrPanelNavGroup as TrPanelNavGroupModel,
  type TrPanelNavItem,
} from "@/lib/tr/panelNav";

/** Shared with TrPanelNavLinks so the pill can slide between rows and headings. */
const PILL_SPRING = { type: "spring", stiffness: 520, damping: 42 } as const;

function ActiveMarks() {
  return (
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
  );
}

/** The dot that says a new order arrived. */
function OrderDot({ className }: { className: string }) {
  return <span className={`h-1.5 w-1.5 rounded-full bg-rose-500 ${className}`} aria-hidden />;
}

export function TrPanelNavGroup({
  group,
  currentPath,
  collapsed,
  hasNewOrders,
  onSelect,
  onPrefetch,
}: {
  group: TrPanelNavGroupModel;
  /** Real path, or the optimistic one right after a click. */
  currentPath: string;
  collapsed: boolean;
  /** A new order arrived: the Siparişler group and its Siparişler page carry a dot. */
  hasNewOrders: boolean;
  onSelect: (href: string) => void;
  onPrefetch: (kind: TrPanelNavItem["prefetch"]) => void;
}) {
  const panelId = useId();
  const childActive = isTrPanelNavGroupActive(currentPath, group);

  // Opens by itself when you are on one of its pages. A manual toggle is tied to
  // the path it was made on, so it lapses on the next navigation instead of
  // leaving the group closed around the page you just opened.
  const [manual, setManual] = useState<{ open: boolean; at: string } | null>(
    null,
  );
  const open =
    manual && manual.at === currentPath ? manual.open : childActive;
  const toggle = () => setManual({ open: !open, at: currentPath });

  const headingActive = childActive && !open;

  if (collapsed) {
    return (
      <CollapsedGroup
        group={group}
        headingActive={childActive}
        showDot={hasNewOrders && group.id === "orders"}
        currentPath={currentPath}
        onSelect={onSelect}
        onPrefetch={onPrefetch}
      />
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={`${panelSidebarRowClass} ${
          headingActive ? "text-white" : panelSidebarRowIdleClass
        }`}
      >
        {headingActive ? <ActiveMarks /> : null}
        <PanelNavGroupIcon
          groupId={group.id}
          className="relative h-[18px] w-[18px] shrink-0"
        />
        <span className="relative min-w-0 flex-1 truncate">{group.label}</span>
        {hasNewOrders && group.id === "orders" && !open ? (
          <OrderDot className="relative" />
        ) : null}
        <ChevronDown
          className={`relative h-4 w-4 shrink-0 text-white/50 transition-transform duration-200 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.ul
            id={panelId}
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-0.5 overflow-hidden pt-0.5"
          >
            {group.children.map((child) => {
              const active = isTrPanelNavActive(currentPath, child);
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    prefetch
                    onClick={() => onSelect(child.href)}
                    onPointerEnter={() => onPrefetch(child.prefetch)}
                    onFocus={() => onPrefetch(child.prefetch)}
                    className={`${panelSidebarChildRowClass} ${
                      active ? "text-white" : panelSidebarRowIdleClass
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {active ? <ActiveMarks /> : null}
                    <span className="relative min-w-0 truncate">
                      {child.label}
                    </span>
                    {hasNewOrders && child.href === trPanelOrdersPath() ? (
                      <OrderDot className="relative ml-auto" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * Icon-only rail: the pages open in a small flyout beside the icon. It is portalled
 * to <body> because the sidebar clips its own overflow.
 */
function CollapsedGroup({
  group,
  headingActive,
  showDot,
  currentPath,
  onSelect,
  onPrefetch,
}: {
  group: TrPanelNavGroupModel;
  headingActive: boolean;
  showDot: boolean;
  currentPath: string;
  onSelect: (href: string) => void;
  onPrefetch: (kind: TrPanelNavItem["prefetch"]) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(
    null,
  );
  const flyoutId = useId();

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const openFlyout = () => {
    cancelClose();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setAnchor({ top: rect.top, left: rect.right + 8 });
  };
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setAnchor(null), 140);
  };

  useEffect(() => {
    if (!anchor) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAnchor(null);
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        (flyoutRef.current?.contains(target) ||
          buttonRef.current?.contains(target))
      ) {
        return;
      }
      setAnchor(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [anchor]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={openFlyout}
        onPointerEnter={openFlyout}
        onPointerLeave={closeSoon}
        onFocus={openFlyout}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        aria-controls={anchor ? flyoutId : undefined}
        aria-label={group.label}
        className={`${panelSidebarRowClass} ${
          headingActive ? "text-white" : panelSidebarRowIdleClass
        }`}
      >
        {headingActive ? <ActiveMarks /> : null}
        <PanelNavGroupIcon
          groupId={group.id}
          className="relative h-[18px] w-[18px] shrink-0"
        />
        {showDot ? <OrderDot className="absolute top-2.5 left-[27px]" /> : null}
      </button>

      {anchor
        ? createPortal(
            <div
              ref={flyoutRef}
              id={flyoutId}
              role="menu"
              aria-label={group.label}
              onPointerEnter={cancelClose}
              onPointerLeave={closeSoon}
              style={{
                position: "fixed",
                top: anchor.top,
                left: anchor.left,
                animation: `tr-panel-enter 140ms ${panelEaseCss} backwards`,
              }}
              className="z-50 min-w-[176px] rounded-lg border border-white/10 bg-[color:var(--panel-shell,#1C1C1E)] p-1.5 text-white shadow-xl"
            >
              <p className="px-3 pt-1.5 pb-1 text-[11px] font-semibold tracking-[0.14em] text-white/45 uppercase">
                {group.label}
              </p>
              {group.children.map((child) => {
                const active = isTrPanelNavActive(currentPath, child);
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    prefetch
                    role="menuitem"
                    onClick={() => {
                      setAnchor(null);
                      onSelect(child.href);
                    }}
                    onPointerEnter={() => onPrefetch(child.prefetch)}
                    onFocus={() => onPrefetch(child.prefetch)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-10 items-center rounded-md px-3 text-[13.5px] font-medium transition-colors duration-150 motion-reduce:transition-none ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {child.label}
                  </Link>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
