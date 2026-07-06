"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthRedirectBridge } from "@/components/AuthRedirectBridge";
import { CookieNotice } from "@/components/legal/CookieNotice";
import { IntroLoader } from "@/components/IntroLoader";
import { clearIntroLoadingLock, shouldShowIntroLoader } from "@/lib/introLoader";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showIntroLoader = shouldShowIntroLoader(pathname);

  useEffect(() => {
    if (showIntroLoader) return;
    clearIntroLoadingLock();
  }, [showIntroLoader]);

  return (
    <AuthProvider>
      {showIntroLoader ? <IntroLoader /> : null}
      <AuthRedirectBridge />
      <AppShell>{children}</AppShell>
      <CookieNotice />
    </AuthProvider>
  );
}
