"use client";

import type { ReactNode } from "react";

interface TrMobileBuyBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Fixed bottom purchase bar — mobile only. Keeps Sepete ekle / Hemen al
 * always reachable while scrolling PDP content.
 */
export function TrMobileBuyBar({ children, className = "" }: TrMobileBuyBarProps) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[90] md:hidden ${className}`}
    >
      <div
        className="pointer-events-auto border-t border-blueprint-border bg-ice-floor/95 px-4 pt-3 backdrop-blur-sm"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {children}
      </div>
    </div>
  );
}
