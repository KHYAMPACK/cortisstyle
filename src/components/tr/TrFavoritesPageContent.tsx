"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { TrFavoriteButton } from "@/components/tr/TrFavoriteButton";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import { trClothPath, trProductsPath } from "@/lib/tr/paths";
import { trPanelFadeTransition } from "@/components/tr/panel/TrPanelMotion";
import {
  useTrFavoritesStore,
  type TrFavoriteItem,
} from "@/store/trFavoritesStore";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

function favoriteAsProduct(item: TrFavoriteItem): TrProductWithBoutique {
  const images = item.image ? [item.image] : [];
  return {
    id: item.productId,
    boutiqueId: item.boutiqueId,
    title: item.title,
    description: null,
    priceKurus: item.priceKurus,
    compareAtPriceKurus: null,
    size: null,
    sizes: [],
    colors: [],
    conditionLabel: null,
    category: item.category,
    images,
    marketplaceImages: images,
    status: "available",
    stock: 1,
    sortOrder: 0,
    createdAt: "",
    updatedAt: "",
    boutique: {
      id: item.boutiqueId,
      slug: item.boutiqueSlug,
      name: item.boutiqueName,
      legalName: null,
      description: null,
      logoUrl: null,
      whatsappPhone: null,
      instagramHandle: null,
      themeAccent: null,
      shippingNote: null,
      exchangePolicy: null,
      physicalAddress: null,
      homeLayout: null,
      customDomain: null,
      editorialContent: null,
      status: "verified",
      createdAt: "",
      updatedAt: "",
    },
  };
}

export function TrFavoritesPageContent() {
  const items = useTrFavoritesStore((state) => state.items);

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={trPanelFadeTransition}
        className="px-5 py-16 text-center md:px-10"
      >
        <p className="font-serif text-2xl tracking-[-0.02em] text-neutral-950">
          Henüz favori yok
        </p>
        <p className="text-meta mx-auto mt-3 max-w-md text-[12px] leading-relaxed">
          Ürün kartlarındaki kalbe dokunarak parçaları burada saklayın — giriş
          gerekmez.
        </p>
        <Link
          href={trProductsPath()}
          className="mt-8 inline-flex border border-brand-primary bg-brand-primary px-6 py-3.5 text-[11px] tracking-[0.2em] text-white uppercase transition-colors hover:border-brand-primary-hover hover:bg-brand-primary-hover"
        >
          Ürünlere git
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={trPanelFadeTransition}
      className="pb-16"
    >
      <p className="text-meta px-5 py-5 text-center text-[10px] tracking-[0.18em] uppercase md:px-10">
        {items.length} favori
      </p>
      <div className="mx-auto max-w-6xl px-0 md:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-x-[2px] gap-y-0 bg-white md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const product = favoriteAsProduct(item);
            const demoIcon = isTrDemoIconSrc(item.image);

            return (
              <div key={item.productId} className="relative bg-white">
                <TrFavoriteButton
                  product={product}
                  className="absolute top-2 right-2 z-10 h-8 w-8"
                />
                <Link
                  href={trClothPath(item.productId)}
                  className="group block outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-ice-floor">
                    {demoIcon && item.image ? (
                      <TrDemoGarmentVisual src={item.image} showLabel />
                    ) : item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        unoptimized
                        className="object-contain p-5 transition-transform duration-700 group-hover:scale-[1.03] md:p-7"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center">
                        <span className="font-serif text-lg text-neutral-700">
                          {item.title}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="px-2 pt-3 pb-5 text-center md:px-2.5">
                    <h3 className="line-clamp-2 font-serif text-[11px] leading-snug tracking-[0.12em] text-neutral-900 uppercase md:text-xs">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-[11px] tracking-[0.06em] text-brand-primary">
                      {formatTryFromKurus(item.priceKurus)}
                    </p>
                    <p className="text-meta mt-1.5 text-[9px] tracking-[0.22em] uppercase">
                      {item.boutiqueName}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
