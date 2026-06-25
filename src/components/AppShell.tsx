"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { isDarkGatePath, isMaintenancePath } from "@/lib/launchGates";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isDarkGate = isDarkGatePath(pathname);
  const isMaintenance = isMaintenancePath(pathname);

  if (isMaintenance) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <div className={isHome || isDarkGate ? "" : "pt-20"}>{children}</div>
    </>
  );
}
