"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthRedirectBridge } from "@/components/AuthRedirectBridge";
import { CookieNotice } from "@/components/legal/CookieNotice";
import { IntroLoader } from "@/components/IntroLoader";
import { clearIntroLoadingLock, shouldMountIntroLoader } from "@/lib/introLoader";
import { useBoutiqueHostSlug } from "@/lib/tr/boutiqueStorefrontContext";

export function Providers({
  children,
  boutiqueSlug = null,
}: {
  children: React.ReactNode;
  boutiqueSlug?: string | null;
}) {
  const pathname = usePathname();
  const resolvedBoutiqueSlug = useBoutiqueHostSlug(boutiqueSlug);
  const showIntroLoader = shouldMountIntroLoader(
    pathname,
    resolvedBoutiqueSlug,
  );

  useEffect(() => {
    if (showIntroLoader) return;
    clearIntroLoadingLock();
  }, [showIntroLoader]);

  return (
    <AuthProvider>
      {showIntroLoader ? (
        <IntroLoader boutiqueSlug={resolvedBoutiqueSlug} />
      ) : null}
      <AuthRedirectBridge />
      <AppShell boutiqueSlug={resolvedBoutiqueSlug}>{children}</AppShell>
      <CookieNotice boutiqueSlug={resolvedBoutiqueSlug} />
    </AuthProvider>
  );
}
