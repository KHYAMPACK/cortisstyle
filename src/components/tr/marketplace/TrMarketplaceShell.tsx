"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { TrScrollRestoration } from "@/components/tr/TrScrollRestoration";
import { trSearchPath } from "@/lib/tr/paths";

interface TrMarketplaceShellProps {
  children: ReactNode;
  /** Floating corner chrome (not a header bar). */
  chrome: ReactNode;
  footer: ReactNode;
}

function isTrSearchPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const path = pathname.replace(/\/$/, "") || "/";
  return path === trSearchPath();
}

/**
 * Marketplace shell — floating chrome stays on all marketplace routes
 * (including search). Branded boutique pages use their own shell instead.
 */
export function TrMarketplaceShell({
  children,
  chrome,
  footer,
}: TrMarketplaceShellProps) {
  const pathname = usePathname();
  const isSearchPage = isTrSearchPath(pathname);

  return (
    <div className="min-h-full bg-ice-floor text-jet-black">
      <TrScrollRestoration />
      {chrome}
      <main className={isSearchPage ? "min-h-dvh" : undefined}>{children}</main>
      {isSearchPage ? null : footer}
    </div>
  );
}
