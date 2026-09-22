"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import {
  IYZICO_BUYER_PROTECTION_HEADER_MAX_PX,
  type TrIyzicoBuyerProtection as TrIyzicoBuyerProtectionConfig,
} from "@/lib/tr/payments/registry";
import { isBoutiqueHomePath } from "@/lib/tr/paths";

const BUYER_PROTECTION_SRC =
  "https://static.iyzipay.com/buyer-protection/buyer-protection.js";

function syncIyzicoHomeChrome(onHome: boolean) {
  const mobile = window.matchMedia(
    `(max-width: ${IYZICO_BUYER_PROTECTION_HEADER_MAX_PX}px)`,
  ).matches;
  document.documentElement.toggleAttribute("data-iyzico-home", onHome);
  document.documentElement.toggleAttribute(
    "data-iyzico-header",
    onHome && mobile,
  );
}

/** iyzico Alıcı Koruması overlay — boutique homepage only. */
export function TrIyzicoBuyerProtection({
  boutiqueSlug,
  config,
}: {
  boutiqueSlug: string;
  config: TrIyzicoBuyerProtectionConfig | null;
}) {
  const pathname = usePathname();
  const onHome = Boolean(config) && isBoutiqueHomePath(pathname, boutiqueSlug);

  useLayoutEffect(() => {
    if (!config) return;

    const apply = () => syncIyzicoHomeChrome(onHome);
    apply();

    const mq = window.matchMedia(
      `(max-width: ${IYZICO_BUYER_PROTECTION_HEADER_MAX_PX}px)`,
    );
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.removeAttribute("data-iyzico-home");
      document.documentElement.removeAttribute("data-iyzico-header");
    };
  }, [config, onHome]);

  if (!config) return null;

  const bootstrap = {
    token: config.token,
    position: config.position,
    mobilePosition: config.mobilePosition ?? "header",
    ideaSoft: config.ideaSoft,
    pwi: config.pwi,
    headerMaxPx: IYZICO_BUYER_PROTECTION_HEADER_MAX_PX,
  };

  return (
    <>
      <Script id="iyzico-buyer-protection-config" strategy="afterInteractive">
        {`
(function () {
  var c = ${JSON.stringify(bootstrap)};
  var mobile = window.matchMedia("(max-width:" + c.headerMaxPx + "px)").matches;
  var position = mobile ? c.mobilePosition : c.position;
  window.iyz = {
    token: c.token,
    position: position,
    ideaSoft: c.ideaSoft,
    pwi: c.pwi
  };
})();
`}
      </Script>
      <Script
        id="iyzico-buyer-protection"
        src={BUYER_PROTECTION_SRC}
        strategy="afterInteractive"
      />
    </>
  );
}
