import Script from "next/script";
import { getIyzicoBuyerProtection } from "@/lib/tr/payments/registry";

const BUYER_PROTECTION_SRC =
  "https://static.iyzipay.com/buyer-protection/buyer-protection.js";

/** iyzico Alıcı Koruması floating badge — merchant website criteria. */
export function TrIyzicoBuyerProtection({
  boutiqueSlug,
}: {
  boutiqueSlug: string;
}) {
  const config = getIyzicoBuyerProtection(boutiqueSlug);
  if (!config) return null;

  return (
    <>
      <Script id="iyzico-buyer-protection-config" strategy="afterInteractive">
        {`window.iyz = ${JSON.stringify(config)};`}
      </Script>
      <Script
        id="iyzico-buyer-protection"
        src={BUYER_PROTECTION_SRC}
        strategy="lazyOnload"
      />
    </>
  );
}
