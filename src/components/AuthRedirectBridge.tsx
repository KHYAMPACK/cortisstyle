"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { IntroLoader } from "@/components/IntroLoader";
import { useAuth } from "@/context/AuthContext";
import { hasAuthTokensInUrl } from "@/lib/authRedirect";
import { WARDROBE_APP_PATH } from "@/lib/wardrobeGate";

export function AuthRedirectBridge() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isAuthenticated,
    isResolvingAuthRedirect,
    setIsResolvingAuthRedirect,
  } = useAuth();

  useEffect(() => {
    if (pathname === "/auth/callback") return;

    if (!hasAuthTokensInUrl()) return;

    setIsResolvingAuthRedirect(true);
  }, [pathname, setIsResolvingAuthRedirect]);

  useEffect(() => {
    if (!isResolvingAuthRedirect || pathname === "/auth/callback") return;

    if (!isAuthenticated) return;

    const hash = window.location.hash;
    const search = window.location.search;

    if (hash || search.includes("code=")) {
      window.history.replaceState({}, "", pathname);
    }

    if (pathname !== WARDROBE_APP_PATH) {
      router.replace(WARDROBE_APP_PATH);
    }

    setIsResolvingAuthRedirect(false);
  }, [
    isAuthenticated,
    isResolvingAuthRedirect,
    pathname,
    router,
    setIsResolvingAuthRedirect,
  ]);

  if (!isResolvingAuthRedirect) {
    return null;
  }

  return (
    <IntroLoader forceActive statusLabel="VALIDATING STUDIO ACCESS" />
  );
}
