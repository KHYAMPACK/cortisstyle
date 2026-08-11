import Image from "next/image";

/** Official iyzico logo pack — Visa / MC / Amex / Troy + iyzico ile öde. */
export const IYZICO_PAYMENT_ASSETS = {
  footerBandColored: "/tr/payments/iyzico/footer-logo-band-colored.svg",
  footerBandWhite: "/tr/payments/iyzico/footer-logo-band-white.svg",
  checkoutPayColored: "/tr/payments/iyzico/checkout-iyzico-ile-ode-colored.svg",
} as const;

type FooterVariant = "light" | "dark";

/**
 * Footer payment trust strip (Visa, Mastercard, Amex, Troy, iyzico).
 * Required for iyzico merchant website criteria.
 */
export function TrIyzicoFooterPaymentBand({
  variant = "light",
  className = "",
}: {
  variant?: FooterVariant;
  className?: string;
}) {
  const src =
    variant === "dark"
      ? IYZICO_PAYMENT_ASSETS.footerBandWhite
      : IYZICO_PAYMENT_ASSETS.footerBandColored;

  return (
    <div className={className}>
      <p
        className={
          variant === "dark"
            ? "text-[10px] tracking-[0.14em] text-white/45 uppercase"
            : "text-[10px] tracking-[0.14em] text-neutral-500 uppercase"
        }
      >
        Güvenli ödeme
      </p>
      <Image
        src={src}
        alt="Visa, Mastercard, American Express, Troy ve iyzico ile öde"
        width={429}
        height={32}
        className="mt-2 h-7 w-auto max-w-full object-contain object-left sm:h-8"
        unoptimized
      />
    </div>
  );
}

/**
 * Checkout “iyzico ile öde” mark — place near order submit / payment method.
 */
export function TrIyzicoCheckoutBadge({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Image
        src={IYZICO_PAYMENT_ASSETS.checkoutPayColored}
        alt="iyzico ile öde"
        width={180}
        height={48}
        className="h-9 w-auto max-w-full object-contain object-left sm:h-10"
        unoptimized
      />
      <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">
        Kart ödemeleri iyzico altyapısı ile güvenli şekilde işlenir. Visa ve
        Mastercard kabul edilir.
      </p>
    </div>
  );
}
