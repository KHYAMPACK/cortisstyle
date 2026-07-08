import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrBoutiqueBrandedShell } from "@/components/tr/boutique/TrBoutiqueBrandedShell";
import { TrMarketplaceChrome } from "@/components/tr/TrMarketplaceChrome";
import { TrProductDetailPanel } from "@/components/tr/TrProductDetailPanel";
import { TrProductGallery } from "@/components/tr/TrProductGallery";
import { hasBoutiqueBrand } from "@/lib/tr/boutiqueBrand";
import { safeGetBoutiqueStorefront, safeGetPublicProduct } from "@/lib/tr/publicData";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await safeGetPublicProduct(productId);

  if (!product) {
    return { title: "Ürün bulunamadı" };
  }

  return {
    title: product.title,
    description: product.description ?? `${product.title} — ${product.boutique.name}`,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productId } = await params;
  const product = await safeGetPublicProduct(productId);

  if (!product) {
    notFound();
  }

  const branded = hasBoutiqueBrand(product.boutique);
  const wrapperClass = branded
    ? "mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10"
    : "";
  const gridClass = branded
    ? "grid gap-8 lg:grid-cols-2 lg:gap-12"
    : "grid gap-0 lg:grid-cols-2";
  const panelClass = branded ? "" : "border-b border-blueprint-border";

  const content = (
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
            <TrProductGallery product={product} />
          </div>

          <div className={branded ? "" : "px-5 py-8 md:px-10 md:py-10"}>
            <TrProductDetailPanel product={product} branded={branded} />
          </div>
        </div>
      </div>
    </div>
  );

  if (branded) {
    const storefront = await safeGetBoutiqueStorefront(product.boutique.slug);

    return (
      <TrBoutiqueBrandedShell
        boutique={product.boutique}
        products={storefront?.products ?? []}
      >
        {content}
      </TrBoutiqueBrandedShell>
    );
  }

  return <TrMarketplaceChrome>{content}</TrMarketplaceChrome>;
}
