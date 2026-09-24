import { TrBoutiquePdpRelated } from "@/components/tr/boutique/pdp/TrBoutiquePdpRelated";
import { TrProductDetailPanel } from "@/components/tr/TrProductDetailPanel";
import { TrProductGallery } from "@/components/tr/TrProductGallery";
import { isAtelierEditorialSkin } from "@/lib/tr/boutiqueHome";
import { getStorefrontGalleryImages } from "@/lib/tr/productImages";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrBoutiquePdpSplitProps {
  product: TrProductWithBoutique;
  branded: boolean;
  colorSiblings?: TrProductWithBoutique[];
  iyzicoCheckout?: boolean;
}

/**
 * Mobile DOM order: gallery → product info → you may also like.
 * Desktop: gallery | info; related under gallery (classic) or full-width (atelier).
 */
export function TrBoutiquePdpSplit({
  product,
  branded,
  colorSiblings = [],
  iyzicoCheckout = false,
}: TrBoutiquePdpSplitProps) {
  const atelier = isAtelierEditorialSkin(product.boutique.slug);
  const galleryProduct = {
    ...product,
    images: getStorefrontGalleryImages(product),
  };

  const wrapperClass = branded
    ? atelier
      ? "mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14"
      : "mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10"
    : "";
  const gridClass = branded
    ? atelier
      ? "grid gap-10 lg:grid-cols-2 lg:gap-16"
      : "grid gap-8 lg:grid-cols-2 lg:gap-12"
    : "grid gap-0 lg:grid-cols-2";
  const panelClass = branded ? "" : "border-b border-blueprint-border";

  const related = (
    <TrBoutiquePdpRelated product={product} branded={branded} />
  );

  return (
    <div className={panelClass}>
      <div className={wrapperClass}>
        <div className={gridClass}>
          <div
            className={
              branded
                ? ""
                : "border-b border-blueprint-border px-5 py-6 md:px-10 lg:border-r lg:border-b-0"
            }
          >
            <TrProductGallery product={galleryProduct} />
          </div>

          <div
            className={
              branded
                ? atelier
                  ? ""
                  : "lg:row-span-2"
                : "border-b border-blueprint-border px-5 py-8 md:px-10 md:py-10 lg:row-span-2 lg:border-b-0"
            }
          >
            <TrProductDetailPanel
              product={product}
              branded={branded}
              colorSiblings={colorSiblings}
              iyzicoCheckout={iyzicoCheckout}
            />
          </div>

          {!atelier ? (
            <div
              className={
                branded
                  ? ""
                  : "px-5 py-6 md:px-10 lg:border-r lg:border-blueprint-border"
              }
            >
              {related}
            </div>
          ) : null}
        </div>

        {atelier ? <div className="mt-14 md:mt-20">{related}</div> : null}
      </div>
    </div>
  );
}
