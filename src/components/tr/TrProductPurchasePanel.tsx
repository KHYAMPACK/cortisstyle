import { TrCheckoutComingSoon } from "@/components/tr/TrCheckoutComingSoon";
import { TrPurchaseActions } from "@/components/tr/TrPurchaseActions";
import { TrSandboxBanner } from "@/components/tr/TrSandboxBanner";
import { TrWhatsAppOrderButton } from "@/components/tr/TrWhatsAppOrderButton";
import { isTrCheckoutEnabled } from "@/lib/tr/platform";
import { getProductCoverImage } from "@/lib/tr/paths";
import {
  buildProductOrderMessage,
  buildWhatsAppOrderUrl,
} from "@/lib/tr/whatsapp";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrProductPurchasePanelProps {
  product: TrProductWithBoutique;
}

export function TrProductPurchasePanel({ product }: TrProductPurchasePanelProps) {
  const checkoutEnabled = isTrCheckoutEnabled();

  if (checkoutEnabled) {
    return (
      <div className="mt-8 space-y-4">
        <TrSandboxBanner />

        <TrPurchaseActions
          productId={product.id}
          boutiqueId={product.boutiqueId}
          boutiqueName={product.boutique.name}
          boutiqueSlug={product.boutique.slug}
          title={product.title}
          priceKurus={product.priceKurus}
          image={getProductCoverImage(product)}
          size={product.size}
          status={product.status}
        />

        {product.boutique.whatsappPhone ? (
          <a
            href={buildWhatsAppOrderUrl(
              product.boutique.whatsappPhone,
              buildProductOrderMessage(product),
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-[11px] tracking-[0.1em] text-neutral-600 underline underline-offset-2 transition-colors hover:text-neutral-900"
          >
            Sorular için WhatsApp&apos;tan yazın
          </a>
        ) : null}
      </div>
    );
  }

  if (product.boutique.whatsappPhone) {
    return (
      <div className="mt-8 space-y-4">
        <TrWhatsAppOrderButton
          phone={product.boutique.whatsappPhone}
          product={product}
          status={product.status}
        />

        {product.boutique.shippingNote ? (
          <p className="text-center text-[11px] text-neutral-600">
            {product.boutique.shippingNote}
          </p>
        ) : null}
        {product.boutique.exchangePolicy ? (
          <p className="text-center text-[11px] text-neutral-500">
            {product.boutique.exchangePolicy}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <TrCheckoutComingSoon />
    </div>
  );
}
