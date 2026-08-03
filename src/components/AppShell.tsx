"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { isAuthCallbackPath } from "@/lib/authRedirect";
import { isMaintenancePath } from "@/lib/launchGates";
import { useBoutiqueHostSlug } from "@/lib/tr/boutiqueStorefrontContext";
import { isTrMarketPath } from "@/lib/marketPreference";

export function AppShell({
  children,
  boutiqueSlug = null,
}: {
  children: React.ReactNode;
  boutiqueSlug?: string | null;
}) {
  const pathname = usePathname();
  const hostBoutiqueSlug = useBoutiqueHostSlug(boutiqueSlug);
  const isHome = pathname === "/";
  const isMaintenance = isMaintenancePath(pathname);
  const isAuthCallback = isAuthCallbackPath(pathname);
  const isTrMarket = isTrMarketPath(pathname);
  const isBoutiqueStorefront = Boolean(hostBoutiqueSlug);

  if (isMaintenance || isAuthCallback || isTrMarket || isBoutiqueStorefront) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <div className={isHome ? "" : "pt-20"}>{children}</div>
    </>
  );
}
