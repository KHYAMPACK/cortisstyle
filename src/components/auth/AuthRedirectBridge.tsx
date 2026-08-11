"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { IntroLoader } from "@/components/IntroLoader";
import { useAuth } from "@/context/AuthContext";
import {
  DEFAULT_AUTH_NEXT_PATH,
  hasAuthTokensInUrl,
} from "@/lib/authRedirect";

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

    if (pathname !== DEFAULT_AUTH_NEXT_PATH && !pathname.startsWith("/tr/")) {
      router.replace(DEFAULT_AUTH_NEXT_PATH);
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

  return <IntroLoader forceActive statusLabel="OTURUM DOĞRULANIYOR" />;
}
