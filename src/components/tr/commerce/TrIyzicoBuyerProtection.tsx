import Script from "next/script";
import {
  getIyzicoBuyerProtection,
  IYZICO_BUYER_PROTECTION_HEADER_MAX_PX,
} from "@/lib/tr/payments/registry";

const BUYER_PROTECTION_SRC =
  "https://static.iyzipay.com/buyer-protection/buyer-protection.js";

/** iyzico Alıcı Koruması overlay — merchant website criteria. */
export function TrIyzicoBuyerProtection({
  boutiqueSlug,
}: {
  boutiqueSlug: string;
}) {
  const config = getIyzicoBuyerProtection(boutiqueSlug);
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
  if (position === "header") {
    document.documentElement.setAttribute("data-iyzico-header", "");
  }
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
