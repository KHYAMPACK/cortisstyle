import { TrPurchaseActions } from "@/components/tr/TrPurchaseActions";
import { TrSandboxBanner } from "@/components/tr/TrSandboxBanner";
import { isTrDemoProduct } from "@/lib/tr/demoIds";
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
  /** When true, Sepete ekle / Hemen al stays enabled and asks for size via sheet. */
  selectionRequired?: boolean;
  onRequestSelection?: (intent?: "add" | "buyNow") => void;
  /** Selected beden has no stock — CTA becomes gelince haber et. */
  sizeOutOfStock?: boolean;
  /** Hide primary purchase CTAs (e.g. moved to mobile sticky bar). */
  hideActions?: boolean;
  className?: string;
  iyzicoCheckout?: boolean;
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
  iyzicoCheckout = false,
}: TrProductPurchasePanelProps) {
  const orderProduct = {
    title: product.title,
    priceKurus: product.priceKurus,
    size: selectedSize,
    color: selectedColor,
  };

  return (
    <div className={`mt-8 space-y-4 ${className}`}>
      <TrSandboxBanner demo={isTrDemoProduct(product)} iyzicoCheckout={iyzicoCheckout} />

      {hideActions ? null : (
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
      )}

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
