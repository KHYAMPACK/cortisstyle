import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrBoutiqueBrandedShell } from "@/components/tr/boutique/TrBoutiqueBrandedShell";
import { TrMarketplaceChrome } from "@/components/tr/TrMarketplaceChrome";
import { TrProductGallery } from "@/components/tr/TrProductGallery";
import { TrProductPurchasePanel } from "@/components/tr/TrProductPurchasePanel";
import { hasBoutiqueBrand } from "@/lib/tr/boutiqueBrand";
import { getTrCategoryLabel } from "@/lib/tr/categories";
import { trBoutiquePath } from "@/lib/tr/paths";
import { safeGetPublicProduct } from "@/lib/tr/publicData";
import { formatTryFromKurus } from "@/types/tr-marketplace";

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

function ProductDetailContent({
  product,
  branded,
}: {
  product: NonNullable<Awaited<ReturnType<typeof safeGetPublicProduct>>>;
  branded: boolean;
}) {
  const isAvailable = product.status === "available";
  const categoryLabel = getTrCategoryLabel(product.category);

  const backLink = branded ? (
    <Link
      href={trBoutiquePath(product.boutique.slug)}
      className="text-[11px] tracking-[0.12em] text-neutral-600 uppercase transition-colors hover:text-neutral-900"
    >
      ← Mağazaya dön
    </Link>
  ) : (
    <Link
      href={trBoutiquePath(product.boutique.slug)}
      className="text-meta text-[10px] tracking-[0.22em] uppercase transition-colors hover:text-jet-black"
    >
      ← {product.boutique.name}
    </Link>
  );

  const wrapperClass = branded
    ? "mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10"
    : "";

  const gridClass = branded
    ? "grid gap-8 lg:grid-cols-2 lg:gap-12"
    : "grid gap-0 lg:grid-cols-2";

  const panelClass = branded
    ? ""
    : "border-b border-blueprint-border";

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
            <TrProductGallery product={product} />
          </div>

          <div className={branded ? "" : "px-5 py-8 md:px-10 md:py-10"}>
            {backLink}

            {!branded ? (
              <p className="text-meta mt-6 text-[9px] tracking-[0.5em] uppercase">
                [ ÜRÜN ]
              </p>
            ) : null}

            <h1
              className={
                branded
                  ? "mt-4 font-serif text-3xl tracking-tight text-neutral-950 md:text-4xl"
                  : "mt-3 font-serif text-3xl leading-none tracking-[-0.03em] text-neutral-950 md:text-4xl"
              }
            >
              {product.title}
            </h1>

            <p className="mt-4 font-serif text-2xl tracking-[-0.02em] text-neutral-950">
              {formatTryFromKurus(product.priceKurus)}
            </p>

            <dl
              className={`mt-6 space-y-3 text-[12px] ${
                branded
                  ? "border-t border-black/5 pt-6"
                  : "border-t border-blueprint-border pt-6"
              }`}
            >
              {!branded ? (
                <div className="flex gap-4">
                  <dt className="text-meta w-28 shrink-0 tracking-[0.12em] uppercase">
                    Satıcı
                  </dt>
                  <dd>
                    <Link
                      href={trBoutiquePath(product.boutique.slug)}
                      className="text-jet-black underline underline-offset-2"
                    >
                      {product.boutique.name}
                    </Link>
                  </dd>
                </div>
              ) : null}
              {product.size ? (
                <div className="flex gap-4">
                  <dt
                    className={
                      branded
                        ? "w-28 shrink-0 text-neutral-500"
                        : "text-meta w-28 shrink-0 tracking-[0.12em] uppercase"
                    }
                  >
                    Beden
                  </dt>
                  <dd>{product.size}</dd>
                </div>
              ) : null}
              {product.conditionLabel ? (
                <div className="flex gap-4">
                  <dt
                    className={
                      branded
                        ? "w-28 shrink-0 text-neutral-500"
                        : "text-meta w-28 shrink-0 tracking-[0.12em] uppercase"
                    }
                  >
                    Durum
                  </dt>
                  <dd>{product.conditionLabel}</dd>
                </div>
              ) : null}
              {categoryLabel ? (
                <div className="flex gap-4">
                  <dt
                    className={
                      branded
                        ? "w-28 shrink-0 text-neutral-500"
                        : "text-meta w-28 shrink-0 tracking-[0.12em] uppercase"
                    }
                  >
                    Kategori
                  </dt>
                  <dd>{categoryLabel}</dd>
                </div>
              ) : null}
              <div className="flex gap-4">
                <dt
                  className={
                    branded
                      ? "w-28 shrink-0 text-neutral-500"
                      : "text-meta w-28 shrink-0 tracking-[0.12em] uppercase"
                  }
                >
                  Stok
                </dt>
                <dd>{isAvailable ? "Satışta" : "Satıldı"}</dd>
              </div>
            </dl>

            {product.description ? (
              <div
                className={`mt-6 pt-6 ${
                  branded ? "border-t border-black/5" : "border-t border-blueprint-border"
                }`}
              >
                {!branded ? (
                  <p className="text-meta text-[10px] tracking-[0.18em] uppercase">
                    Açıklama
                  </p>
                ) : (
                  <p className="text-[11px] tracking-[0.1em] text-neutral-500 uppercase">
                    Açıklama
                  </p>
                )}
                <p className="mt-3 text-[13px] leading-relaxed text-neutral-800">
                  {product.description}
                </p>
              </div>
            ) : null}

            <TrProductPurchasePanel product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productId } = await params;
  const product = await safeGetPublicProduct(productId);

  if (!product) {
    notFound();
  }

  const branded = hasBoutiqueBrand(product.boutique);
  const content = <ProductDetailContent product={product} branded={branded} />;

  if (branded) {
    return (
      <TrBoutiqueBrandedShell boutique={product.boutique}>{content}</TrBoutiqueBrandedShell>
    );
  }

  return <TrMarketplaceChrome>{content}</TrMarketplaceChrome>;
}
