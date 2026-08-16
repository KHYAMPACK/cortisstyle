"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { TrBackButton } from "@/components/tr/TrBackButton";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { TrFavoriteButton } from "@/components/tr/TrFavoriteButton";
import { TrLookBoutiqueCredits } from "@/components/tr/TrLookBoutiqueCredits";
import { TrLookSizeGateSheet } from "@/components/tr/TrLookSizeGateSheet";
import { TrMobileBuyBar } from "@/components/tr/TrMobileBuyBar";
import { TrQuickAddToCartButton } from "@/components/tr/TrQuickAddToCartButton";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { TrYouMayAlsoLike } from "@/components/tr/TrYouMayAlsoLike";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import { isTrDemoProduct } from "@/lib/tr/looks/demoCatalog";
import {
  getProductCoverImageFor,
  isCatalogCutoutImage,
} from "@/lib/tr/productImages";
import { resolveProductSizes } from "@/lib/tr/productOptions";
import { trCartPath, trClothPath, trHomePath } from "@/lib/tr/paths";
import { useTrAddedToCartStore } from "@/store/trAddedToCartStore";
import { useTrCartStore } from "@/store/trCartStore";
import { cartTotalKurus } from "@/types/tr-cart";
import type { TrCartLineItem } from "@/types/tr-cart";
import type { TrLookWithProducts } from "@/types/tr-look";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";
import { formatTryFromKurus } from "@/types/tr-marketplace";

interface TrLookPageProps {
  look: TrLookWithProducts;
  relatedLooks: TrLookWithProducts[];
  relatedProducts: TrProductWithBoutique[];
  cartEnabled: boolean;
}

function productToCartLine(
  product: TrProductWithBoutique,
  size: string | null,
): TrCartLineItem {
  return {
    productId: product.id,
    boutiqueId: product.boutiqueId,
    boutiqueName: product.boutique.name,
    boutiqueSlug: product.boutique.slug,
    title: product.title,
    priceKurus: product.priceKurus,
    image: getProductCoverImageFor("marketplace", product),
    size,
  };
}

function resolveLineSize(
  product: TrProductWithBoutique,
  override?: string | null,
): string | null {
  if (override != null && override !== "") return override;
  const sizes = resolveProductSizes(product);
  if (sizes.length === 1) return sizes[0]!;
  if (sizes.length === 0) return product.size ?? null;
  return null;
}

function needsSizePick(product: TrProductWithBoutique): boolean {
  return resolveProductSizes(product).length > 1;
}

export function TrLookPage({
  look,
  relatedLooks,
  relatedProducts,
  cartEnabled,
}: TrLookPageProps) {
  const addItem = useTrCartStore((state) => state.addItem);
  const cartItems = useTrCartStore((state) => state.items);
  const openAddedSheet = useTrAddedToCartStore((state) => state.open);
  const [addFeedback, setAddFeedback] = useState<"added" | "partial" | null>(
    null,
  );
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);

  const boutiques = look.products.map((product) => product.boutique);
  const availableProducts = look.products.filter(
    (product) => product.status === "available",
  );
  const demoLook = look.products.some(isTrDemoProduct);
  const alreadyInCart =
    availableProducts.length > 0 &&
    availableProducts.every((product) =>
      cartItems.some((entry) => entry.productId === product.id),
    );

  const piecesNeedingSize = useMemo(
    () => availableProducts.filter(needsSizePick),
    [availableProducts],
  );

  const commitOutfit = (sizesByProductId?: Record<string, string | null>) => {
    if (!cartEnabled) return;
    let added = 0;
    const newlyAdded: TrProductWithBoutique[] = [];
    const lines: TrCartLineItem[] = [];

    for (const product of availableProducts) {
      const size = resolveLineSize(
        product,
        sizesByProductId?.[product.id],
      );
      const line = productToCartLine(product, size);
      if (addItem(line)) {
        added += 1;
        newlyAdded.push(product);
        lines.push(line);
      }
    }

    if (added === 0) return;
    setAddFeedback(added === availableProducts.length ? "added" : "partial");
    setSizeSheetOpen(false);

    const lead = newlyAdded[0] ?? availableProducts[0];
    if (!lead) return;
    openAddedSheet({
      productId: lead.id,
      title: look.title,
      priceKurus: cartTotalKurus(lines),
      image: look.coverImage ?? getProductCoverImageFor("marketplace", lead),
      size: null,
      color: null,
      boutiqueName: null,
      pieceCount: added,
    });
  };

  const handleAddOutfit = () => {
    if (!cartEnabled || availableProducts.length === 0) return;
    if (piecesNeedingSize.length > 0) {
      setSizeSheetOpen(true);
      return;
    }
    commitOutfit();
  };

  const addCta =
    alreadyInCart || addFeedback === "added" ? (
      <TrSoftNavLink
        href={trCartPath()}
        className="font-cadde-nav inline-flex w-full items-center justify-center bg-jet-black px-6 py-4 text-[11px] font-semibold tracking-[0.28em] text-white uppercase transition-opacity hover:opacity-85"
      >
        [ Sepete git ]
      </TrSoftNavLink>
    ) : (
      <button
        type="button"
        onClick={handleAddOutfit}
        disabled={availableProducts.length === 0}
        className="font-cadde-nav inline-flex w-full items-center justify-center bg-jet-black px-6 py-4 text-[11px] font-semibold tracking-[0.28em] text-white uppercase transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        [ Kombini sepete ekle ]
      </button>
    );

  return (
    <div className="pt-16 pb-28 md:pt-20 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 md:grid-cols-2 md:gap-14 md:px-10 md:py-12">
        <div className="relative aspect-[3/4] overflow-hidden bg-ice-floor">
          {isTrDemoIconSrc(look.coverImage) ? (
            <TrDemoGarmentVisual
              src={look.coverImage}
              showLabel
              iconClassName="h-20 w-20"
            />
          ) : look.coverImage ? (
            <Image
              src={look.coverImage}
              alt=""
              fill
              unoptimized
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6">
              <span className="font-cadde-display text-2xl uppercase tracking-[0.02em] text-neutral-600">
                {look.title}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <TrBackButton
            fallbackHref={trHomePath()}
            className="text-meta self-start text-[10px] tracking-[0.22em] uppercase transition-opacity hover:opacity-60"
          />

          <p className="mt-6 font-cadde-nav text-[10px] font-semibold tracking-[0.32em] text-cadde-red uppercase">
            01. Kombin
          </p>
          <h1 className="mt-3 font-cadde-display text-3xl uppercase leading-[0.86] tracking-[0.02em] text-jet-black md:text-5xl">
            {look.title}
          </h1>
          {look.subtitle ? (
            <p className="mt-3 font-cadde-nav text-[13px] leading-relaxed tracking-[0.04em] text-neutral-500">
              {look.subtitle}
            </p>
          ) : null}

          <TrLookBoutiqueCredits boutiques={boutiques} />

          <ul className="mt-8 divide-y divide-black/10 border-y border-black/10">
            {look.products.map((product) => {
              const cover = getProductCoverImageFor("marketplace", product);
              const cutout =
                !isTrDemoIconSrc(cover) && isCatalogCutoutImage(cover);
              return (
                <li key={product.id} className="flex items-stretch gap-3 py-4">
                  <TrSoftNavLink
                    href={trClothPath(product.id)}
                    className="flex min-w-0 flex-1 gap-4 transition-opacity hover:opacity-80"
                  >
                    <span
                      className={`relative h-20 w-16 shrink-0 overflow-hidden ${
                        cutout || isTrDemoIconSrc(cover)
                          ? "bg-ice-floor"
                          : "bg-neutral-100"
                      }`}
                    >
                      {isTrDemoIconSrc(cover) ? (
                        <TrDemoGarmentVisual
                          src={cover}
                          iconClassName="h-7 w-7"
                        />
                      ) : cover ? (
                        <Image
                          src={cover}
                          alt=""
                          fill
                          unoptimized
                          sizes="64px"
                          className={
                            cutout
                              ? "object-contain p-1.5"
                              : "object-cover"
                          }
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-cadde-nav text-[11px] tracking-[0.14em] text-jet-black uppercase">
                        {product.title}
                      </span>
                      <span className="mt-1 block font-cadde-nav text-[11px] text-jet-black">
                        {formatTryFromKurus(product.priceKurus)}
                      </span>
                      <span className="text-meta mt-1 block text-[9px] tracking-[0.18em] uppercase">
                        {product.boutique.name}
                      </span>
                    </span>
                  </TrSoftNavLink>

                  <div className="flex shrink-0 flex-col items-end justify-center gap-2">
                    <TrFavoriteButton
                      product={product}
                      className="h-8 w-8"
                    />
                    {cartEnabled ? (
                      <TrQuickAddToCartButton product={product} compact />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {cartEnabled ? (
            <div className="mt-8 hidden space-y-3 md:block">
              {demoLook ? (
                <p className="text-[10px] tracking-[0.14em] text-neutral-500 uppercase">
                  Demo kombin
                </p>
              ) : null}
              {addCta}
              {addFeedback === "partial" ? (
                <p className="text-[11px] text-neutral-600">
                  Bazı parçalar zaten sepetteydi — yeniler eklendi.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <TrYouMayAlsoLike
        looks={relatedLooks}
        products={relatedProducts}
        className="pb-8 md:pb-16"
      />

      {cartEnabled ? (
        <TrMobileBuyBar>
          {demoLook ? (
            <p className="mb-2 text-center text-[10px] tracking-[0.14em] text-neutral-500 uppercase">
              Demo kombin
            </p>
          ) : null}
          {addCta}
        </TrMobileBuyBar>
      ) : null}

      <TrLookSizeGateSheet
        open={sizeSheetOpen}
        onClose={() => setSizeSheetOpen(false)}
        products={availableProducts}
        onConfirm={commitOutfit}
      />
    </div>
  );
}
