import { TrBoutiquePdpRelated } from "@/components/tr/boutique/pdp/TrBoutiquePdpRelated";
import { TrProductDetailPanel } from "@/components/tr/TrProductDetailPanel";
import { TrProductGallery } from "@/components/tr/TrProductGallery";
import { getStorefrontGalleryImages } from "@/lib/tr/productImages";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrBoutiquePdpSplitProps {
  product: TrProductWithBoutique;
  branded: boolean;
  entry?: "cadde" | "store";
}

/**
 * Mobile DOM order: gallery → product info (incl. banner) → you may also like.
 * Desktop: gallery | info, with recommendations under the gallery.
 */
export function TrBoutiquePdpSplit({
  product,
  branded,
  entry = "store",
}: TrBoutiquePdpSplitProps) {
  const galleryProduct = {
    ...product,
    images: getStorefrontGalleryImages(product),
  };

  const wrapperClass = branded
    ? "mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10"
    : "";
  const gridClass = branded
    ? "grid gap-8 lg:grid-cols-2 lg:gap-12"
    : "grid gap-0 lg:grid-cols-2";
  const panelClass = branded ? "" : "border-b border-blueprint-border";

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
                ? "lg:row-span-2"
                : "border-b border-blueprint-border px-5 py-8 md:px-10 md:py-10 lg:row-span-2 lg:border-b-0"
            }
          >
            <TrProductDetailPanel
              product={product}
              branded={branded}
              entry={entry}
            />
          </div>

          <div
            className={
              branded
                ? ""
                : "px-5 py-6 md:px-10 lg:border-r lg:border-blueprint-border"
            }
          >
            <TrBoutiquePdpRelated product={product} branded={branded} />
          </div>
        </div>
      </div>
    </div>
  );
}
