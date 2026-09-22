"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthRedirectBridge } from "@/components/AuthRedirectBridge";
import { CookieNotice } from "@/components/legal/CookieNotice";
import { IntroLoader } from "@/components/IntroLoader";
import { clearIntroLoadingLock, shouldMountIntroLoader } from "@/lib/introLoader";
import { BoutiqueSlugProvider } from "@/lib/tr/boutiqueStorefrontContext";

export function Providers({
  children,
  boutiqueSlug = null,
}: {
  children: React.ReactNode;
  boutiqueSlug?: string | null;
}) {
  const pathname = usePathname();
  const showIntroLoader = shouldMountIntroLoader(pathname, boutiqueSlug);

  useEffect(() => {
    if (showIntroLoader) return;
    clearIntroLoadingLock();
  }, [showIntroLoader]);

  return (
    <BoutiqueSlugProvider value={boutiqueSlug}>
      <AuthProvider>
        {showIntroLoader ? <IntroLoader /> : null}
        <AuthRedirectBridge />
        <AppShell boutiqueSlug={boutiqueSlug}>{children}</AppShell>
        <CookieNotice />
      </AuthProvider>
    </BoutiqueSlugProvider>
  );
}
