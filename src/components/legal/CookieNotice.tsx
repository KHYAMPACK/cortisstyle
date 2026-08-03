"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  acceptCookieNotice,
  hasAcceptedCookieNotice,
} from "@/lib/cookieConsent";
import { isAuthCallbackPath } from "@/lib/authRedirect";
import { isMaintenancePath } from "@/lib/launchGates";
import { useBoutiqueHostSlug } from "@/lib/tr/boutiqueStorefrontContext";
import { isTrMarketPath } from "@/lib/marketPreference";

export function CookieNotice({
  boutiqueSlug = null,
}: {
  boutiqueSlug?: string | null;
}) {
  const pathname = usePathname();
  const hostBoutiqueSlug = useBoutiqueHostSlug(boutiqueSlug);
  const [visible, setVisible] = useState(false);

  const shouldHideRoute =
    isMaintenancePath(pathname) ||
    isAuthCallbackPath(pathname) ||
    isTrMarketPath(pathname) ||
    Boolean(hostBoutiqueSlug);

  useEffect(() => {
    if (shouldHideRoute) {
      setVisible(false);
      return;
    }

    setVisible(!hasAcceptedCookieNotice());
  }, [shouldHideRoute, pathname]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-blueprint-border bg-white/95 px-4 py-4 shadow-[0_-12px_40px_rgba(0,0,0,0.06)] backdrop-blur-md md:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-[11px] leading-relaxed text-meta md:max-w-2xl">
          We use essential cookies for sign-in and analytics to improve the site.
          By continuing, you agree to our{" "}
          <Link
            href="/privacy#cookies"
            className="text-jet-black underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/privacy#cookies"
            className="text-meta text-[10px] tracking-[0.2em] uppercase transition-colors hover:text-jet-black"
          >
            Privacy Policy
          </Link>
          <button
            type="button"
            onClick={() => {
              acceptCookieNotice();
              setVisible(false);
            }}
            className="border border-jet-black bg-jet-black px-4 py-2.5 font-mono text-[10px] tracking-[0.2em] text-white uppercase transition-opacity hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
