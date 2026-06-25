"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthRedirectBridge } from "@/components/AuthRedirectBridge";
import { IntroLoader } from "@/components/IntroLoader";
import { isAuthCallbackPath } from "@/lib/authRedirect";
import { isMaintenancePath } from "@/lib/launchGates";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showIntroLoader =
    !isMaintenancePath(pathname) && !isAuthCallbackPath(pathname);

  return (
    <AuthProvider>
      {showIntroLoader ? <IntroLoader /> : null}
      <AuthRedirectBridge />
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
