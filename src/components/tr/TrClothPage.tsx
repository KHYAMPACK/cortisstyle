"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { TrBackButton } from "@/components/tr/TrBackButton";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { TrProductColorPicker } from "@/components/tr/TrProductColorPicker";
import { TrProductPurchasePanel } from "@/components/tr/TrProductPurchasePanel";
import { TrProductSizePicker } from "@/components/tr/TrProductSizePicker";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { TrYouMayAlsoLike } from "@/components/tr/TrYouMayAlsoLike";
import { getTrCategoryLabel } from "@/lib/tr/categories";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import {
  getMarketplaceProductImages,
  isCatalogCutoutImage,
} from "@/lib/tr/productImages";
import {
  resolveProductColors,
  resolveProductSizes,
} from "@/lib/tr/productOptions";
import { trBoutiquePath, trBoutiqueProductPath, trHomePath } from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrClothPageProps {
  product: TrProductWithBoutique;
  relatedProducts: TrProductWithBoutique[];
}

export function TrClothPage({ product, relatedProducts }: TrClothPageProps) {
  const images = getMarketplaceProductImages(product);
  const cover = images[0] ?? null;
  const demoIcon = isTrDemoIconSrc(cover);
  const cutout = !demoIcon && isCatalogCutoutImage(cover);
  const sizes = useMemo(() => resolveProductSizes(product), [product]);
  const colors = useMemo(() => resolveProductColors(product), [product]);
  const categoryLabel = getTrCategoryLabel(product.category);
  const isAvailable = product.status === "available";

  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length === 1 ? sizes[0]! : null,
  );
  const [selectedColor, setSelectedColor] = useState(
    colors.length === 1 ? colors[0]! : (colors[0] ?? null),
  );
  const [activeImage, setActiveImage] = useState(0);

  const sizeRequired = sizes.length > 0;
  const canOrder = isAvailable && (!sizeRequired || Boolean(selectedSize));
  const displayImage = images[activeImage] ?? cover;

  return (
    <div className="pt-16 md:pt-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 md:grid-cols-2 md:gap-14 md:px-10 md:py-12">
        <div>
          <div
            className={`relative aspect-[2/3] overflow-hidden ${
              cutout || demoIcon ? "bg-ice-floor" : "bg-neutral-100"
            }`}
          >
            {demoIcon ? (
              <TrDemoGarmentVisual
                src={displayImage}
                showLabel
                iconClassName="h-16 w-16"
              />
            ) : displayImage ? (
              <Image
                src={displayImage}
                alt=""
                fill
                unoptimized
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className={
                  cutout ? "object-contain p-8 md:p-12" : "object-cover"
                }
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6">
                <span className="font-serif text-xl text-neutral-600">
                  {product.title}
                </span>
              </div>
            )}
          </div>

          {images.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`relative h-16 w-12 shrink-0 overflow-hidden border ${
                    index === activeImage
                      ? "border-jet-black"
                      : "border-transparent opacity-70"
                  } ${isCatalogCutoutImage(src) ? "bg-ice-floor" : "bg-neutral-100"}`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    unoptimized
                    sizes="48px"
                    className={
                      isCatalogCutoutImage(src)
                        ? "object-contain p-1"
                        : "object-cover"
                    }
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <TrBackButton
            fallbackHref={trHomePath()}
            className="text-meta text-[10px] tracking-[0.22em] uppercase transition-opacity hover:opacity-60"
          />

          <p className="mt-6 text-[9px] tracking-[0.5em] text-brand-primary uppercase">
            Parça
          </p>
          <h1 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-neutral-950 md:text-4xl">
            {product.title}
          </h1>
          <p className="mt-4 font-serif text-2xl tracking-[-0.02em] text-brand-primary">
            {formatTryFromKurus(product.priceKurus)}
          </p>

          <TrProductColorPicker
            colors={colors}
            selectedColor={selectedColor}
            onChange={setSelectedColor}
          />
          <TrProductSizePicker
            sizes={sizes}
            selectedSize={selectedSize}
            onChange={setSelectedSize}
          />

          <dl className="mt-6 space-y-3 text-[12px]">
            {categoryLabel ? (
              <div className="flex gap-3">
                <dt className="text-meta w-24 shrink-0 tracking-[0.14em] uppercase">
                  Kategori
                </dt>
                <dd>{categoryLabel}</dd>
              </div>
            ) : null}
            {product.conditionLabel ? (
              <div className="flex gap-3">
                <dt className="text-meta w-24 shrink-0 tracking-[0.14em] uppercase">
                  Durum
                </dt>
                <dd>{product.conditionLabel}</dd>
              </div>
            ) : null}
            <div className="flex gap-3">
              <dt className="text-meta w-24 shrink-0 tracking-[0.14em] uppercase">
                Butik
              </dt>
              <dd>
                <TrSoftNavLink
                  href={trBoutiquePath(product.boutique.slug)}
                  className="underline underline-offset-2 hover:text-brand-primary"
                >
                  {product.boutique.name}
                </TrSoftNavLink>
              </dd>
            </div>
          </dl>

          {product.description ? (
            <p className="mt-6 text-[13px] leading-relaxed text-neutral-600">
              {product.description}
            </p>
          ) : null}

          <TrProductPurchasePanel
            product={product}
            selectedSize={selectedSize}
            selectedColor={selectedColor?.name ?? null}
            canOrder={canOrder}
          />

          <TrSoftNavLink
            href={trBoutiqueProductPath(
              product.boutique.slug,
              product.id,
            )}
            className="mt-3 inline-flex w-full items-center justify-center border border-jet-black bg-transparent px-6 py-4 text-[11px] tracking-[0.22em] text-jet-black uppercase transition-opacity hover:opacity-70"
          >
            Butikte bu ürün hakkında bilgi
          </TrSoftNavLink>
        </div>
      </div>

      <TrYouMayAlsoLike products={relatedProducts} className="pb-16" />
    </div>
  );
}
