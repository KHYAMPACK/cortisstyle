"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { TrFavoriteButton } from "@/components/tr/TrFavoriteButton";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
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
    storefrontImages: [],
    lifestyleImages: [],
    catalogBackgroundId: null,
    features: {},
    status: "available",
    stock: 1,
    sizeStocks: {},
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
      vergiNo: null,
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
        <p className="font-cadde-display text-3xl uppercase tracking-[0.02em] text-jet-black">
          Henüz favori yok
        </p>
        <p className="mx-auto mt-3 max-w-md font-cadde-nav text-[12px] leading-relaxed tracking-[0.04em] text-neutral-500">
          Ürün kartlarındaki kalbe dokunarak parçaları burada saklayın — giriş
          gerekmez.
        </p>
        <TrSoftNavLink
          href={trProductsPath()}
          className="font-cadde-nav mt-8 inline-flex text-[11px] font-semibold tracking-[0.28em] text-jet-black uppercase transition-colors hover:text-cadde-red"
        >
          [ Ürünlere git ]
        </TrSoftNavLink>
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
      <p className="px-5 py-5 text-center font-cadde-nav text-[10px] tracking-[0.22em] text-neutral-500 uppercase md:px-10">
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
                <TrSoftNavLink
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
                        <span className="font-cadde-display text-lg uppercase tracking-[0.02em] text-neutral-700">
                          {item.title}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="px-2 pt-3 pb-5 text-center md:px-2.5">
                    <h3 className="line-clamp-2 font-cadde-nav text-[11px] leading-snug tracking-[0.14em] text-jet-black uppercase md:text-xs">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 font-cadde-nav text-[11px] tracking-[0.06em] text-jet-black">
                      {formatTryFromKurus(item.priceKurus)}
                    </p>
                    <p className="text-meta mt-1.5 text-[9px] tracking-[0.22em] uppercase">
                      {item.boutiqueName}
                    </p>
                  </div>
                </TrSoftNavLink>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
