import { TrCheckoutComingSoon } from "@/components/tr/TrCheckoutComingSoon";
import { TrPurchaseActions } from "@/components/tr/TrPurchaseActions";
import { TrSandboxBanner } from "@/components/tr/TrSandboxBanner";
import { TrWhatsAppOrderButton } from "@/components/tr/TrWhatsAppOrderButton";
import { isProductCartCheckoutEnabled } from "@/lib/tr/cartCheckout";
import { isTrDemoProduct } from "@/lib/tr/looks/demoCatalog";
import { getProductCoverImageFor } from "@/lib/tr/productImages";
import {
  buildProductOrderMessage,
  buildWhatsAppOrderUrl,
} from "@/lib/tr/whatsapp";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrProductPurchasePanelProps {
  product: TrProductWithBoutique;
  selectedSize?: string | null;
  selectedColor?: string | null;
  canOrder?: boolean;
  /** When true, Sepete ekle stays enabled and asks for size via sheet. */
  selectionRequired?: boolean;
  onRequestSelection?: () => void;
  /** Selected beden has no stock — CTA becomes gelince haber et. */
  sizeOutOfStock?: boolean;
  /** Hide primary purchase CTAs (e.g. moved to mobile sticky bar). */
  hideActions?: boolean;
  className?: string;
}

export function TrProductPurchasePanel({
  product,
  selectedSize = null,
  selectedColor = null,
  canOrder = true,
  selectionRequired = false,
  onRequestSelection,
  sizeOutOfStock = false,
  hideActions = false,
  className = "",
}: TrProductPurchasePanelProps) {
  const checkoutEnabled = isProductCartCheckoutEnabled(product);
  const orderProduct = {
    title: product.title,
    priceKurus: product.priceKurus,
    size: selectedSize,
    color: selectedColor,
  };

  const actions = hideActions ? null : checkoutEnabled ? (
    <TrPurchaseActions
      productId={product.id}
      boutiqueId={product.boutiqueId}
      boutiqueName={product.boutique.name}
      boutiqueSlug={product.boutique.slug}
      title={product.title}
      priceKurus={product.priceKurus}
      image={getProductCoverImageFor("marketplace", product)}
      size={selectedSize}
      color={selectedColor}
      status={product.status}
      disabled={!canOrder && !selectionRequired}
      selectionRequired={selectionRequired}
      onRequestSelection={onRequestSelection}
      sizeOutOfStock={sizeOutOfStock}
      whatsappPhone={product.boutique.whatsappPhone}
    />
  ) : product.boutique.whatsappPhone ? (
    <TrWhatsAppOrderButton
      phone={product.boutique.whatsappPhone}
      product={orderProduct}
      status={product.status}
      disabled={!canOrder}
    />
  ) : (
    <TrCheckoutComingSoon />
  );

  if (checkoutEnabled) {
    return (
      <div className={`mt-8 space-y-4 ${className}`}>
        <TrSandboxBanner demo={isTrDemoProduct(product)} />

        {actions}

        {product.boutique.whatsappPhone ? (
          <a
            href={buildWhatsAppOrderUrl(
              product.boutique.whatsappPhone,
              buildProductOrderMessage(orderProduct),
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
      <div className={`mt-8 space-y-4 ${className}`}>
        {actions}

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

  return <div className={`mt-8 ${className}`}>{actions}</div>;
}
