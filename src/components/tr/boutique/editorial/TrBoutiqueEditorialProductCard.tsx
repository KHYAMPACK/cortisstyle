"use client";

import Image from "next/image";
import { TrFavoriteButton } from "@/components/tr/TrFavoriteButton";
import { TrQuickAddToCartButton } from "@/components/tr/TrQuickAddToCartButton";
import {
  TrEditorialSaleBadge,
  discountPercentFromPrices,
} from "@/components/tr/boutique/editorial/TrEditorialSaleBadge";
import { TrBoutiquePendingLink } from "@/components/tr/boutique/editorial/TrBoutiqueNavPending";
import { EDITORIAL_SALE_RED } from "@/lib/tr/boutiqueHome";
import { trProductPath } from "@/lib/tr/paths";
import { resolveProductColors } from "@/lib/tr/productOptions";
import { getProductCoverImageFor, isCatalogCutoutImage } from "@/lib/tr/productImages";
import {
  formatTryFromKurus,
  type TrProduct,
  type TrProductWithBoutique,
} from "@/types/tr-marketplace";

interface TrBoutiqueEditorialProductCardProps {
  product: TrProduct;
  boutiqueSlug: string;
  boutiqueName: string;
  priority?: boolean;
}

export function TrBoutiqueEditorialProductCard({
  product,
  boutiqueSlug,
  boutiqueName,
  priority = false,
}: TrBoutiqueEditorialProductCardProps) {
  const coverImage = getProductCoverImageFor("marketplace", product);
  const coverIsCutout = isCatalogCutoutImage(coverImage);
  const colors = resolveProductColors(product);
  const isSold = product.status === "sold";
  const isNew = product.conditionLabel?.toLocaleLowerCase("tr").includes("yeni");
  const compareAt = product.compareAtPriceKurus;
  const onSale = typeof compareAt === "number" && compareAt > product.priceKurus;
  const pct = onSale
    ? discountPercentFromPrices(product.priceKurus, compareAt)
    : 0;
  const productHref = trProductPath(product.id, boutiqueSlug);

  const withBoutique: TrProductWithBoutique = {
    ...product,
    boutique: {
      id: product.boutiqueId,
      slug: boutiqueSlug,
      name: boutiqueName,
      legalName: null,
      description: null,
      logoUrl: null,
      whatsappPhone: null,
      instagramHandle: null,
      themeAccent: "#111111",
      shippingNote: null,
      exchangePolicy: null,
      physicalAddress: null,
      homeLayout: "editorial",
      customDomain: null,
      editorialContent: null,
      status: "verified",
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    },
  };

  return (
    <article className="group relative bg-white">
      <div
        className={`relative aspect-[3/4] overflow-hidden ${
          coverIsCutout ? "bg-[#F3F1EC]" : "bg-neutral-100"
        }`}
      >
        <TrBoutiquePendingLink
          href={productHref}
          kind="product"
          className="absolute inset-0 block outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          aria-label={product.title}
        >
          {coverImage ? (
            <Image
              src={coverImage}
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`${
                coverIsCutout
                  ? "object-contain p-3 transition-transform duration-700 group-hover:scale-[1.02]"
                  : "object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              } ${isSold ? "opacity-60" : ""}`}
            />
          ) : null}
        </TrBoutiquePendingLink>

        {onSale && pct > 0 && !isSold ? (
          <TrEditorialSaleBadge
            percent={pct}
            className="pointer-events-none absolute top-2 left-2 z-10"
          />
        ) : isNew && !isSold ? (
          <span className="pointer-events-none absolute top-2 left-2 z-10 bg-neutral-500/90 px-2 py-1 text-[9px] tracking-[0.06em] text-white">
            Yeni Ürün
          </span>
        ) : null}

        {isSold ? (
          <span className="pointer-events-none absolute top-2 left-2 z-10 bg-white px-2 py-1 text-[9px] tracking-[0.12em] text-neutral-900 uppercase">
            Satıldı
          </span>
        ) : null}

        <TrFavoriteButton
          product={product}
          boutiqueSlug={boutiqueSlug}
          boutiqueName={boutiqueName}
          className="absolute top-2 right-2 z-10 h-8 w-8 bg-white/80"
        />

        {!isSold ? (
          <div className="absolute inset-x-0 bottom-2 z-10 flex justify-center opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            <TrQuickAddToCartButton product={withBoutique} iconOnly />
          </div>
        ) : null}

        {colors.length > 1 ? (
          <span className="pointer-events-none absolute right-2 bottom-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] text-neutral-800">
            <span
              className="h-2.5 w-2.5 rounded-full border border-black/10"
              style={{
                background: `conic-gradient(${colors
                  .slice(0, 4)
                  .map((c, i) => `${c.hex} ${i * 25}% ${(i + 1) * 25}%`)
                  .join(", ")})`,
              }}
              aria-hidden
            />
            {colors.length}
          </span>
        ) : null}
      </div>

      <TrBoutiquePendingLink
        href={productHref}
        kind="product"
        className="block px-1 pt-3 pb-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 md:px-1.5"
      >
        <h3 className="line-clamp-2 text-[12px] leading-snug text-neutral-900 md:text-[13px]">
          {product.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {onSale ? (
            <>
              <span className="text-[12px] text-neutral-400 line-through">
                {formatTryFromKurus(compareAt)}
              </span>
              <span
                className="text-[13px] font-medium"
                style={{ color: EDITORIAL_SALE_RED }}
              >
                {formatTryFromKurus(product.priceKurus)}
              </span>
              {pct > 0 ? <TrEditorialSaleBadge percent={pct} /> : null}
            </>
          ) : (
            <span className="text-[13px] font-medium text-neutral-900">
              {formatTryFromKurus(product.priceKurus)}
            </span>
          )}
        </div>
      </TrBoutiquePendingLink>
    </article>
  );
}
