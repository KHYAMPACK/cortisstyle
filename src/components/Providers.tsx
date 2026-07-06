"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthRedirectBridge } from "@/components/AuthRedirectBridge";
import { CookieNotice } from "@/components/legal/CookieNotice";
import { IntroLoader } from "@/components/IntroLoader";
import { isAuthCallbackPath } from "@/lib/authRedirect";
import { isMaintenancePath } from "@/lib/launchGates";
import { isTrMarketPath } from "@/lib/marketPreference";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showIntroLoader =
    !isMaintenancePath(pathname) &&
    !isAuthCallbackPath(pathname) &&
    !isTrMarketPath(pathname);

  return (
    <AuthProvider>
      {showIntroLoader ? <IntroLoader /> : null}
      <AuthRedirectBridge />
      <AppShell>{children}</AppShell>
      <CookieNotice />
    </AuthProvider>
  );
}
