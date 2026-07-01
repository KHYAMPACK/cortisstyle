"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { isAuthCallbackPath } from "@/lib/authRedirect";
import { isMaintenancePath } from "@/lib/launchGates";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isMaintenance = isMaintenancePath(pathname);
  const isAuthCallback = isAuthCallbackPath(pathname);

  if (isMaintenance || isAuthCallback) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <div className={isHome ? "" : "pt-20"}>{children}</div>
    </>
  );
}
