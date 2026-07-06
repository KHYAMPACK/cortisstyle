"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { isAuthCallbackPath } from "@/lib/authRedirect";
import { isMaintenancePath } from "@/lib/launchGates";
import { isTrMarketPath } from "@/lib/marketPreference";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isMaintenance = isMaintenancePath(pathname);
  const isAuthCallback = isAuthCallbackPath(pathname);
  const isTrMarket = isTrMarketPath(pathname);

  if (isMaintenance || isAuthCallback || isTrMarket) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <div className={isHome ? "" : "pt-20"}>{children}</div>
    </>
  );
}
